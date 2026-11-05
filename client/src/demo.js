import { BRANCHES, eligible } from "./constants";
const relative = (days) => new Date(Date.now() + days * 86400000).toISOString();
export function initialDemo() {
  const student = {
    _id: "demo-student",
    name: "Rehan Sayed",
    email: "student@placementpal.demo",
    role: "student",
    branch: BRANCHES[2],
    graduationYear: 2026,
    cgpa: 7.46,
    backlogs: 0,
    phone: "",
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    resumeUrl: "https://example.com/demo-resume.pdf",
    githubUrl: "https://github.com",
    college: "Rizvi College of Engineering",
  };
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
      ["JavaScript", "SQL", "Problem solving"],
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
      ["Python", "SQL", "Data structures"],
      8,
      7,
    ],
  ];
  const drives = specs.map((s, i) => ({
    _id: `demo-drive-${i}`,
    company: s[0],
    role: s[1],
    location: s[2],
    workMode: s[3],
    employmentType: i === 4 ? "Internship" : "Full-time",
    ctcMin: s[4],
    ctcMax: s[5],
    skills: s[6],
    minCgpa: s[7],
    maxBacklogs: 0,
    deadline: relative(s[8]),
    driveDate: relative(s[8] + 3),
    branches: BRANCHES.slice(0, 4),
    graduationYears: [2026, 2027],
    status: "Published",
    rounds: [
      "Online assessment",
      "Technical interview",
      "Culture & HR discussion",
    ],
    description: `Join ${s[0]}'s engineering team and help build useful software. You will collaborate with experienced developers, contribute to production features, and grow through code reviews and mentorship.\n\nWe value clear thinking, strong fundamentals, and curiosity. Bring a project you are proud of and be ready to discuss how you built it.`,
    createdAt: relative(-i - 1),
    applicationCount: 0,
  }));
  const applications = [1, 2].map((d, i) => ({
    _id: `demo-app-${i}`,
    student,
    drive: drives[d],
    status: i ? "Applied" : "Interview",
    snapshot: student,
    createdAt: relative(-4),
    history: [
      { status: "Applied", note: "Application submitted.", at: relative(-4) },
      ...(!i
        ? [
            {
              status: "Shortlisted",
              note: "Profile shortlisted by the placement team.",
              at: relative(-2),
            },
            {
              status: "Interview",
              note: "Prepare your project walkthrough for the technical round.",
              at: relative(-1),
            },
          ]
        : []),
    ],
  }));
  return {
    student,
    drives,
    applications,
    students: [student],
    announcements: [
      {
        _id: "demo-note-1",
        title: "Your next opportunity is closer than you think.",
        body: "Complete your profile, explore eligible drives, and keep an eye on your application timeline. Small steps add up.",
        category: "Update",
        createdAt: relative(-1),
      },
      {
        _id: "demo-note-2",
        title: "Make your project walkthrough count",
        body: "Prepare a 3-minute walkthrough covering the problem, your architecture, one difficult bug, and what you would improve.",
        category: "Preparation",
        createdAt: relative(-2),
      },
    ],
  };
}
export function loadDemo() {
  try {
    return (
      JSON.parse(localStorage.getItem("placementpal-demo-v1")) || initialDemo()
    );
  } catch {
    return initialDemo();
  }
}
export function demoRequest(path, options, currentUser) {
  const db = loadDemo();
  const body = options.body || {};
  const method = options.method || "GET";
  const save = (result) => {
    localStorage.setItem("placementpal-demo-v1", JSON.stringify(db));
    return result;
  };
  if (path === "/profile" && currentUser.role === "admin") {
    db.officer = { ...(db.officer || {}), name: body.name, phone: body.phone };
    return save({ user: { ...currentUser, ...db.officer } });
  }
  if (path === "/profile") {
    db.student = { ...db.student, ...body };
    return save({ user: { ...db.student, role: currentUser.role } });
  }
  if (path === "/drives" && method === "GET")
    return {
      drives: db.drives
        .filter((d) => currentUser.role === "admin" || d.status !== "Draft")
        .map((d) => ({
          ...d,
          eligibility: eligible(currentUser, d),
          applicationCount: db.applications.filter((a) => a.drive._id === d._id)
            .length,
          myApplication:
            db.applications.find(
              (a) => a.drive._id === d._id && a.student._id === currentUser._id,
            ) || null,
        })),
    };
  if (path === "/drives" && method === "POST") {
    const drive = {
      ...body,
      _id: crypto.randomUUID(),
      createdAt: relative(0),
      applicationCount: 0,
    };
    db.drives.push(drive);
    return save({ drive });
  }
  if (/^\/drives\/[^/]+$/.test(path) && method === "PATCH") {
    const id = path.split("/")[2];
    db.drives = db.drives.map((d) => (d._id === id ? { ...d, ...body } : d));
    return save({});
  }
  if (path.endsWith("/apply")) {
    const drive = db.drives.find((d) => d._id === path.split("/")[2]);
    if (
      db.applications.some(
        (a) => a.drive._id === drive._id && a.student._id === currentUser._id,
      )
    )
      throw new Error("You have already applied.");
    const check = eligible(currentUser, drive);
    if (!check.eligible) throw new Error(check.reasons.join(" "));
    if (!currentUser.resumeUrl) throw new Error("Add your resume link first.");
    const application = {
      _id: crypto.randomUUID(),
      student: currentUser,
      snapshot: currentUser,
      drive,
      status: "Applied",
      createdAt: relative(0),
      history: [
        { status: "Applied", note: "Application submitted.", at: relative(0) },
      ],
    };
    db.applications.unshift(application);
    return save({ application });
  }
  if (path === "/applications")
    return {
      applications: db.applications.map((a) => ({
        ...a,
        drive: db.drives.find((d) => d._id === a.drive._id) || a.drive,
      })),
    };
  if (path.includes("/applications/") && method !== "GET") {
    const app = db.applications.find((a) => a._id === path.split("/")[2]);
    if (app.status === "Withdrawn")
      throw new Error("This application has been withdrawn.");
    const status = path.endsWith("/withdraw") ? "Withdrawn" : body.status;
    app.status = status;
    app.history.push({
      status,
      note: body.note || "Updated in demo.",
      at: relative(0),
    });
    return save({ application: app });
  }
  if (path === "/students") return { students: [db.student] };
  if (path === "/announcements" && method === "POST") {
    db.announcements.unshift({
      ...body,
      _id: crypto.randomUUID(),
      createdAt: relative(0),
    });
    return save({});
  }
  if (path === "/announcements") return { announcements: db.announcements };
  return {};
}
