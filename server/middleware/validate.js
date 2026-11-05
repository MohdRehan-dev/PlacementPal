const { z } = require("zod");
const ApiError = require("../utils/ApiError");
const text = (max = 200) => z.string().trim().min(1).max(max);
const link = z.union([
  z.literal(""),
  z
    .string()
    .url()
    .max(1000)
    .refine((v) => /^https:\/\//i.test(v), "Use an HTTPS URL."),
]);
const branches = [
  "Computer Science",
  "Information Technology",
  "Electronics & Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
];
const profile = z.object({
  name: text(80),
  branch: z.enum(branches),
  graduationYear: z.number().int().min(2024).max(2040),
  cgpa: z.number().min(0).max(10),
  backlogs: z.number().int().min(0).max(50),
  phone: z.string().trim().max(20),
  skills: z.array(text(50)).max(20),
  preferredRoles: z
    .array(text(80))
    .max(4)
    .refine(
      (roles) =>
        new Set(roles.map((role) => role.toLowerCase())).size === roles.length,
      "Choose each role once.",
    )
    .optional(),
  experience: z
    .array(
      z
        .object({
          role: text(100),
          company: text(100),
          startDate: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
          endDate: z.union([
            z.literal(""),
            z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
          ]),
          description: z.string().trim().max(1000),
        })
        .refine((entry) => !entry.endDate || entry.endDate >= entry.startDate, {
          path: ["endDate"],
          message: "End month must be on or after the start month.",
        }),
    )
    .max(10)
    .optional(),
  projects: z
    .array(
      z.object({
        name: text(100),
        description: z.string().trim().max(1000),
        liveUrl: link.refine(Boolean, "Add a live project link."),
        githubUrl: link,
      }),
    )
    .max(10)
    .optional(),
  resumeUrl: link,
  githubUrl: link,
});
const drive = z
  .object({
    company: text(100),
    role: text(100),
    location: text(150),
    workMode: z.enum(["On-site", "Hybrid", "Remote"]),
    employmentType: z.enum(["Full-time", "Internship"]),
    ctcMin: z.number().min(0).max(200),
    ctcMax: z.number().min(0).max(200),
    description: text(6000),
    skills: z.array(text(50)).max(20),
    minCgpa: z.number().min(0).max(10),
    maxBacklogs: z.number().int().min(0).max(50),
    branches: z.array(z.enum(branches)).min(1),
    graduationYears: z.array(z.number().int().min(2024).max(2040)).min(1),
    deadline: z.string().datetime(),
    driveDate: z.string().datetime(),
    rounds: z.array(text(100)).min(1).max(10),
    status: z.enum(["Draft", "Published", "Closed"]),
  })
  .refine((v) => v.ctcMax >= v.ctcMin, {
    message: "Maximum CTC must be at least minimum CTC.",
    path: ["ctcMax"],
  })
  .refine((v) => new Date(v.driveDate) >= new Date(v.deadline), {
    message: "Drive date must be on or after the deadline.",
    path: ["driveDate"],
  });
exports.schemas = {
  signup: z.object({
    name: text(80),
    email: z
      .string()
      .trim()
      .email()
      .max(200)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(8).max(128),
  }),
  login: z.object({
    email: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(128),
  }),
  profile,
  officerProfile: z.object({
    name: text(80),
    phone: z.string().trim().max(20),
  }),
  drive,
  status: z.object({
    status: z.enum([
      "Applied",
      "Shortlisted",
      "Assessment",
      "Interview",
      "Offered",
      "Rejected",
    ]),
    note: z.string().trim().max(500).default(""),
  }),
  announcement: z.object({
    title: text(120),
    body: text(1500),
    category: z.enum(["Update", "Preparation", "Important"]),
  }),
};
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success)
    return next(
      new ApiError(
        400,
        result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" "),
      ),
    );
  req.body = result.data;
  next();
};
exports.validId = (req, res, next, id) =>
  /^[0-9a-fA-F]{24}$/.test(id)
    ? next()
    : next(new ApiError(400, "Invalid record ID."));

// Account role chooses the allowed profile fields, never a value from the request body.
exports.validateProfile = (req, res, next) =>
  exports.validate(
    req.user.role === "admin"
      ? exports.schemas.officerProfile
      : exports.schemas.profile,
  )(req, res, next);
