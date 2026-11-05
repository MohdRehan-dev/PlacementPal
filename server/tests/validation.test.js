const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../middleware/validate");
test("signup strips admin role and normalizes email", () => {
  const result = schemas.signup.parse({
    name: " Rey ",
    email: "REY@test.edu",
    password: "Password123",
    role: "admin",
  });
  assert.equal(result.role, undefined);
  assert.equal(result.email, "rey@test.edu");
  assert.equal(result.name, "Rey");
});
test("profile only accepts HTTPS resume and portfolio links", () => {
  const data = {
    name: "Rey",
    branch: "Computer Science",
    graduationYear: 2026,
    cgpa: 7,
    backlogs: 0,
    phone: "",
    skills: [],
    resumeUrl: "",
    githubUrl: "",
  };
  assert.equal(schemas.profile.safeParse(data).success, true);
  for (const resumeUrl of [
    "javascript:alert(1)",
    "http://unsafe.test",
    "not a URL",
  ])
    assert.equal(
      schemas.profile.safeParse({ ...data, resumeUrl }).success,
      false,
    );
});
test("profile rejects impossible academics and cannot change account permissions", () => {
  const data = {
    name: "Rey",
    branch: "Computer Science",
    graduationYear: 2026,
    cgpa: 7,
    backlogs: 0,
    phone: "",
    skills: [],
    resumeUrl: "",
    githubUrl: "",
  };
  for (const patch of [
    { cgpa: 11 },
    { backlogs: -1 },
    { graduationYear: 1900 },
  ])
    assert.equal(
      schemas.profile.safeParse({ ...data, ...patch }).success,
      false,
    );
  const parsed = schemas.profile.parse({
    ...data,
    role: "admin",
    email: "changed@test.edu",
  });
  assert.equal(parsed.role, undefined);
  assert.equal(parsed.email, undefined);
});
test("announcements restrict category and reject whitespace content", () => {
  assert.equal(
    schemas.announcement.safeParse({
      title: " ",
      body: "Hello",
      category: "Update",
    }).success,
    false,
  );
  assert.equal(
    schemas.announcement.safeParse({
      title: "Hello",
      body: "Hello",
      category: "Bad",
    }).success,
    false,
  );
});

test("officer profile only permits name and phone, stripping student and permission fields", () => {
  const parsed = schemas.officerProfile.parse({
    name: "TPO",
    phone: "123",
    cgpa: 9,
    graduationYear: 2026,
    role: "student",
    email: "changed@test.edu",
    preferredRoles: ["React Developer"],
  });
  assert.deepEqual(parsed, { name: "TPO", phone: "123" });
});
test("student profile accepts up to four ranked preferred roles and rejects duplicates", () => {
  const data = {
    name: "Student",
    branch: "Computer Science",
    graduationYear: 2026,
    cgpa: 7.5,
    backlogs: 0,
    phone: "",
    skills: [],
    resumeUrl: "",
    githubUrl: "",
  };
  const preferredRoles = [
    "React Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "Data Engineer",
  ];
  assert.deepEqual(
    schemas.profile.parse({ ...data, preferredRoles }).preferredRoles,
    preferredRoles,
  );
  assert.equal(
    schemas.profile.safeParse({
      ...data,
      preferredRoles: [...preferredRoles, "Backend Developer"],
    }).success,
    false,
  );
  assert.equal(
    schemas.profile.safeParse({
      ...data,
      preferredRoles: ["React Developer", "react developer"],
    }).success,
    false,
  );
  assert.equal(
    schemas.profile.safeParse({ ...data, preferredRoles: ["   "] }).success,
    false,
  );
});
test("profile middleware selects validation using the authenticated account role", () => {
  const { validateProfile } = require("../middleware/validate");
  const req = {
    user: { role: "admin" },
    body: { name: "Officer", phone: "", cgpa: 9 },
  };
  let error;
  validateProfile(req, {}, (err) => {
    error = err;
  });
  assert.equal(error, undefined);
  assert.deepEqual(req.body, { name: "Officer", phone: "" });
});
