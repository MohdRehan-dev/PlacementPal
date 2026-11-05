const { collegeScope } = require("../utils/college");
const Application = require("../models/Application");
const ApiError = require("../utils/ApiError");
exports.list = async (req, res) => {
  const scope = collegeScope(req.user);
  const filter = {
    ...scope,
    ...(req.user.role === "admin" ? {} : { student: req.user._id }),
  };
  res.json({
    applications: await Application.find(filter)
      .populate("drive")
      .populate("student", "name email branch cgpa graduationYear resumeUrl")
      .sort({ createdAt: -1 }),
  });
};
exports.update = async (req, res) => {
  // Optimistic concurrency prevents two officers silently replacing the same status history.
  const app = await Application.findOne({
    _id: req.params.id,
    ...collegeScope(req.user),
  });
  if (!app) throw new ApiError(404, "Application not found.");
  if (app.status === "Withdrawn")
    throw new ApiError(400, "A withdrawn application cannot be advanced.");
  const updated = await Application.findOneAndUpdate(
    { _id: app._id, __v: app.__v },
    {
      $set: { status: req.body.status },
      $push: { history: { ...req.body, at: new Date() } },
      $inc: { __v: 1 },
    },
    { new: true, runValidators: true },
  );
  if (!updated)
    throw new ApiError(409, "This application changed. Refresh and try again.");
  res.json({ application: updated });
};
exports.withdraw = async (req, res) => {
  const app = await Application.findOne({
    _id: req.params.id,
    ...collegeScope(req.user),
    student: req.user._id,
  });
  if (!app) throw new ApiError(404, "Application not found.");
  if (["Offered", "Rejected", "Withdrawn"].includes(app.status))
    throw new ApiError(400, "This application cannot be withdrawn.");
  const updated = await Application.findOneAndUpdate(
    { _id: app._id, student: req.user._id, __v: app.__v },
    {
      $set: { status: "Withdrawn" },
      $push: {
        history: {
          status: "Withdrawn",
          note: "Withdrawn by student.",
          at: new Date(),
        },
      },
      $inc: { __v: 1 },
    },
    { new: true },
  );
  if (!updated)
    throw new ApiError(409, "This application changed. Refresh and try again.");
  res.json({ application: updated });
};
// Spreadsheet-safe CSV: prevent user-entered text from becoming a formula.
const cell = (value) =>
  '"' +
  String(value ?? "")
    .replace(/^[=+@\-\t\r]/, "'$&")
    .replace(/"/g, '""') +
  '"';
exports.exportCsv = async (req, res) => {
  const rows = await Application.find(collegeScope(req.user))
    .populate("drive")
    .sort({ createdAt: -1 });
  const csv = [
    [
      "Student",
      "Email",
      "Branch",
      "CGPA",
      "Company",
      "Role",
      "Status",
      "Applied on",
    ],
    ...rows.map((a) => [
      a.snapshot.name,
      a.snapshot.email,
      a.snapshot.branch,
      a.snapshot.cgpa,
      a.drive?.company,
      a.drive?.role,
      a.status,
      a.createdAt.toISOString(),
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
  res
    .set(
      "Content-Disposition",
      'attachment; filename="placementpal-applications.csv"',
    )
    .type("text/csv")
    .send(csv);
};
