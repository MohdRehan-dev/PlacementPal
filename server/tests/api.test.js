const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const createApp = require("../app");
const User = require("../models/User");
const Drive = require("../models/Drive");
let mongo, app, studentAgent, adminAgent, otherAgent, driveId, applicationId;
const json = (agent) => agent.set("Content-Type", "application/json");
before(async () => {
  mongo = await MongoMemoryServer.create({
    instance: {
      args: [
        "--nounixsocket",
        "--setParameter",
        "diagnosticDataCollectionEnabled=false",
      ],
    },
  });
  await mongoose.connect(mongo.getUri());
  await Promise.all([
    User.init(),
    require("../models/Application").init(),
    Drive.init(),
  ]);
  app = createApp({
    secret: "test-secret-at-least-32-characters-long",
    production: false,
  });
  await User.create({
    name: "Officer",
    email: "officer@test.edu",
    role: "admin",
    passwordHash: await bcrypt.hash("Officer123!", 4),
  });
  studentAgent = request.agent(app);
  adminAgent = request.agent(app);
  otherAgent = request.agent(app);
});
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
test("protected data rejects anonymous requests", async () => {
  await request(app).get("/api/drives").expect(401);
});
test("signup cannot escalate role or expose password hash", async () => {
  const result = await json(studentAgent.post("/api/auth/signup"))
    .send({
      name: "Student",
      email: "student@test.edu",
      password: "Student123!",
      role: "admin",
    })
    .expect(201);
  assert.equal(result.body.user.role, "student");
  assert.equal(result.body.user.passwordHash, undefined);
  await json(otherAgent.post("/api/auth/signup"))
    .send({ name: "Other", email: "other@test.edu", password: "Student123!" })
    .expect(201);
});
test("student cannot create a drive", async () => {
  await json(studentAgent.post("/api/drives")).send({}).expect(403);
});
test("origin guard rejects cross-site writes", async () => {
  await json(studentAgent.patch("/api/profile"))
    .set("Origin", "https://evil.test")
    .send({})
    .expect(403);
});
test("profile validation rejects invalid academics and unsafe links", async () => {
  await json(studentAgent.patch("/api/profile"))
    .send({
      name: "Student",
      branch: "Computer Science",
      graduationYear: 2026,
      cgpa: 11,
      backlogs: 0,
      phone: "",
      skills: [],
      resumeUrl: "javascript:alert(1)",
      githubUrl: "",
    })
    .expect(400);
});
test("officer can create a drive; drafts remain hidden from students", async () => {
  await json(adminAgent.post("/api/auth/login"))
    .send({ email: "officer@test.edu", password: "Officer123!" })
    .expect(200);
  const body = {
    company: "Test Labs",
    role: "Developer",
    location: "Mumbai",
    workMode: "Hybrid",
    employmentType: "Full-time",
    ctcMin: 4,
    ctcMax: 6,
    description: "Build things.",
    skills: ["React"],
    minCgpa: 7,
    maxBacklogs: 0,
    branches: ["Computer Science"],
    graduationYears: [2026],
    deadline: new Date(Date.now() + 86400000).toISOString(),
    driveDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    rounds: ["Interview"],
    status: "Published",
  };
  const result = await json(adminAgent.post("/api/drives"))
    .send(body)
    .expect(201);
  driveId = result.body.drive._id;
  await json(adminAgent.post("/api/drives"))
    .send({ ...body, company: "Draft Labs", status: "Draft" })
    .expect(201);
  const studentDrives = await studentAgent.get("/api/drives").expect(200);
  assert.equal(studentDrives.body.drives.length, 1);
});
test("apply is blocked until profile and resume are complete", async () => {
  await json(studentAgent.post(`/api/drives/${driveId}/apply`))
    .send({})
    .expect(400);
  const profileExtras = {
    preferredRoles: ["Data Engineer", "React Developer"],
    experience: [
      {
        role: "Intern",
        company: "Example Labs",
        startDate: "2026-01",
        endDate: "",
        description: "",
      },
    ],
    projects: [
      {
        name: "Portfolio",
        description: "A sample project",
        liveUrl: "https://example.com",
        githubUrl: "",
      },
    ],
  };
  await json(studentAgent.patch("/api/profile"))
    .send({
      ...profileExtras,
      name: "Student",
      branch: "Computer Science",
      graduationYear: 2026,
      cgpa: 7.5,
      backlogs: 0,
      phone: "",
      skills: ["React"],
      resumeUrl: "https://example.com/resume.pdf",
      githubUrl: "",
    })
    .expect(200);
  const saved = (await studentAgent.get("/api/auth/me").expect(200)).body.user;
  for (const [key, value] of Object.entries(profileExtras)) {
    assert.deepEqual(saved[key], value);
  }

  const result = await json(studentAgent.post(`/api/drives/${driveId}/apply`))
    .send({})
    .expect(201);
  applicationId = result.body.application._id;
});
test("database unique index prevents duplicate applications", async () => {
  await json(studentAgent.post(`/api/drives/${driveId}/apply`))
    .send({})
    .expect(409);
});
test("students only see their own applications and cannot change stages", async () => {
  assert.equal(
    (await otherAgent.get("/api/applications")).body.applications.length,
    0,
  );
  await json(studentAgent.patch(`/api/applications/${applicationId}/status`))
    .send({ status: "Offered" })
    .expect(403);
  await json(otherAgent.post(`/api/applications/${applicationId}/withdraw`))
    .send({})
    .expect(404);
  await otherAgent.get("/api/students").expect(403);
  await studentAgent.get("/api/applications/export").expect(403);
});
test("status changes append history and retain submitted snapshot", async () => {
  const result = await json(
    adminAgent.patch(`/api/applications/${applicationId}/status`),
  )
    .send({ status: "Interview", note: "Bring your project." })
    .expect(200);
  assert.equal(result.body.application.history.length, 2);
  assert.equal(result.body.application.snapshot.cgpa, 7.5);
  assert.equal(result.body.application.snapshot.backlogs, 0);
});
test("withdrawn applications cannot be advanced by officers", async () => {
  await json(studentAgent.post(`/api/applications/${applicationId}/withdraw`))
    .send({})
    .expect(200);
  await json(adminAgent.patch(`/api/applications/${applicationId}/status`))
    .send({ status: "Offered" })
    .expect(400);
});
test("malformed IDs return 400; unknown IDs return 404", async () => {
  await json(studentAgent.post("/api/drives/invalid/apply"))
    .send({})
    .expect(400);
  await json(studentAgent.post("/api/drives/000000000000000000000000/apply"))
    .send({})
    .expect(404);
});
test("officer-only CSV export and announcement creation work", async () => {
  const csv = await adminAgent.get("/api/applications/export").expect(200);
  assert.match(csv.text, /Student/);
  assert.match(csv.headers["content-type"], /text\/csv/);
  await json(adminAgent.post("/api/announcements"))
    .send({ title: "Update", body: "An interview update.", category: "Update" })
    .expect(201);
  const result = await studentAgent.get("/api/announcements").expect(200);
  assert.equal(result.body.announcements.length, 1);
});
test("logout revokes the JWT even if the old cookie is replayed", async () => {
  const login = await json(studentAgent.post("/api/auth/login"))
    .send({ email: "student@test.edu", password: "Student123!" })
    .expect(200);
  const cookie = login.headers["set-cookie"][0].split(";")[0];
  await request(app).get("/api/auth/me").set("Cookie", cookie).expect(200);
  await json(studentAgent.post("/api/auth/logout")).send({}).expect(200);
  await studentAgent.get("/api/auth/me").expect(401);
  await request(app).get("/api/auth/me").set("Cookie", cookie).expect(401);
});

test("foreign drives are hidden and legacy Rizvi drives remain visible", async () => {
  const { _id, ...source } = (await Drive.findById(driveId)).toObject();
  const foreign = await Drive.create({ ...source, collegeId: "other-campus" });
  await Drive.collection.updateOne({ _id }, { $unset: { collegeId: "" } });
  const { body } = await adminAgent.get("/api/drives").expect(200);
  assert.ok(body.drives.some((drive) => drive._id === driveId));
  assert.ok(body.drives.every((drive) => drive._id !== foreign.id));
  await json(adminAgent.patch(`/api/drives/${foreign.id}`))
    .send(source)
    .expect(404);
});
