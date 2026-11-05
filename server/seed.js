require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Drive = require("./models/Drive");
const Application = require("./models/Application");
const Announcement = require("./models/Announcement");
const after = (days) => new Date(Date.now() + days * 86400000);
async function seed() {
  if (!process.env.MONGODB_URI)
    throw new Error("Set MONGODB_URI in server/.env first.");
  if (!process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_STUDENT_PASSWORD)
    throw new Error(
      "Set SEED_ADMIN_PASSWORD and SEED_STUDENT_PASSWORD (8+ characters) before seeding.",
    );
  if (
    [process.env.SEED_ADMIN_PASSWORD, process.env.SEED_STUDENT_PASSWORD].some(
      (p) => p.length < 8,
    )
  )
    throw new Error("Seed passwords need at least 8 characters.");
  await mongoose.connect(process.env.MONGODB_URI);
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@placementpal.demo";
  let admin = await User.findOne({ email: adminEmail });
  if (admin && admin.role !== "admin")
    throw new Error(
      "Seed admin email belongs to a student. Choose a different SEED_ADMIN_EMAIL.",
    );
  if (!admin)
    admin = await User.create({
      name: "Placement Officer",
      email: adminEmail,
      role: "admin",
      passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12),
    });
  let student = await User.findOne({ email: "student@placementpal.demo" });
  if (!student)
    student = await User.create({
      name: "Rehan Sayed",
      email: "student@placementpal.demo",
      passwordHash: await bcrypt.hash(process.env.SEED_STUDENT_PASSWORD, 12),
      branch: "Electronics & Computer Science",
      cgpa: 7.46,
      graduationYear: 2026,
      skills: ["JavaScript", "React", "Node.js", "MongoDB"],
      resumeUrl: "https://example.com/demo-resume.pdf",
    });
  const specs = [
    [
      "Northstar Labs",
      "Associate Software Engineer",
      "Mumbai",
      "Hybrid",
      6,
      9,
      ["React", "Node.js", "MongoDB"],
      6.5,
      5,
    ],
    [
      "Orbit Technologies",
      "Frontend Developer",
      "Bengaluru",
      "Remote",
      5,
      8,
      ["React", "JavaScript", "CSS"],
      6,
      8,
    ],
    [
      "Cedar Systems",
      "Graduate Engineer Trainee",
      "Pune",
      "On-site",
      4.5,
      6.5,
      ["JavaScript", "SQL"],
      7,
      3,
    ],
    [
      "Meridian Digital",
      "Full Stack Developer",
      "Mumbai",
      "Hybrid",
      7,
      10,
      ["React", "Express", "MongoDB"],
      7,
      12,
    ],
    [
      "Arcwave",
      "Backend Engineering Intern",
      "Mumbai",
      "On-site",
      2.4,
      3.6,
      ["Node.js", "REST APIs", "SQL"],
      6,
      15,
    ],
    [
      "Aster Analytics",
      "Software Development Engineer",
      "Hyderabad",
      "Hybrid",
      10,
      14,
      ["Python", "SQL"],
      8,
      7,
    ],
  ];
  const drives = [];
  for (const [
    company,
    role,
    location,
    workMode,
    ctcMin,
    ctcMax,
    skills,
    minCgpa,
    days,
  ] of specs) {
    let drive = await Drive.findOne({ company, createdBy: admin._id });
    if (!drive)
      drive = await Drive.create({
        company,
        role,
        location,
        workMode,
        ctcMin,
        ctcMax,
        skills,
        minCgpa,
        employmentType: company === "Arcwave" ? "Internship" : "Full-time",
        maxBacklogs: 0,
        branches: [
          "Computer Science",
          "Information Technology",
          "Electronics & Computer Science",
          "Electronics",
        ],
        graduationYears: [2026, 2027],
        deadline: after(days),
        driveDate: after(days + 3),
        status: "Published",
        createdBy: admin._id,
        description: `Join ${company}'s engineering team. Build useful software, collaborate with experienced developers, and grow through mentorship and code reviews.\n\nThis is fictional demonstration data, not a real vacancy.`,
        rounds: ["Online assessment", "Technical interview", "HR discussion"],
      });
    drives.push(drive);
  }
  for (const [index, status] of [
    [1, "Interview"],
    [2, "Applied"],
  ]) {
    if (
      !(await Application.exists({
        student: student._id,
        drive: drives[index]._id,
      }))
    ) {
      const snapshot = {
        name: student.name,
        email: student.email,
        branch: student.branch,
        cgpa: student.cgpa,
        graduationYear: student.graduationYear,
        backlogs: student.backlogs,
        resumeUrl: student.resumeUrl,
      };
      await Application.create({
        student: student._id,
        drive: drives[index]._id,
        status,
        snapshot,
        history: [
          {
            status: "Applied",
            note: "Sample application submitted.",
            at: after(-4),
          },
          ...(status === "Interview"
            ? [
                {
                  status: "Interview",
                  note: "Prepare a walkthrough of your project.",
                  at: after(-1),
                },
              ]
            : []),
        ],
      });
    }
  }
  if (!(await Announcement.exists({ createdBy: admin._id })))
    await Announcement.insertMany([
      {
        title: "Welcome to your next chapter.",
        body: "Complete your profile, explore eligible drives, and keep track of every application. All seeded companies are fictional examples.",
        category: "Update",
        createdBy: admin._id,
      },
      {
        title: "Make your project walkthrough count",
        body: "Prepare a 3-minute walkthrough covering the problem, architecture, a difficult bug, and what you would improve.",
        category: "Preparation",
        createdBy: admin._id,
      },
    ]);
  console.log(
    "Demo seed complete. No existing records were deleted or passwords overwritten.",
  );
  console.log(
    `Officer: ${adminEmail}\nStudent: student@placementpal.demo\nUse the seed passwords you configured.`,
  );
}
seed()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
