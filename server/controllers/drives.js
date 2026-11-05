const { collegeScope } = require("../utils/college");
const Drive = require("../models/Drive");
const Application = require("../models/Application");
const eligibility = require("../utils/eligibility");
const ApiError = require("../utils/ApiError");
exports.list = async (req, res) => {
  const scope = collegeScope(req.user);
  const filter = {
    ...scope,
    ...(req.user.role === "admin" ? {} : { status: { $ne: "Draft" } }),
  };
  const drives = await Drive.find(filter).sort({ deadline: 1 }).lean();
  const counts = await Application.aggregate([
    { $match: scope },
    { $group: { _id: "$drive", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    counts.map((c) => [c._id.toString(), c.count]),
  );
  const mine = await Application.find({ ...scope, student: req.user._id })
    .select("drive status")
    .lean();
  res.json({
    drives: drives.map((d) => ({
      ...d,
      eligibility: eligibility(req.user, d),
      applicationCount: countMap[d._id] || 0,
      myApplication:
        mine.find((a) => a.drive.toString() === d._id.toString()) || null,
    })),
  });
};
exports.create = async (req, res) =>
  res.status(201).json({
    drive: await Drive.create({
      ...req.body,
      createdBy: req.user._id,
      collegeId: req.user.collegeId,
    }),
  });
exports.update = async (req, res) => {
  const drive = await Drive.findOneAndUpdate(
    { _id: req.params.id, ...collegeScope(req.user) },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!drive) throw new ApiError(404, "Drive not found.");
  res.json({ drive });
};
exports.apply = async (req, res) => {
  const drive = await Drive.findOne({
    _id: req.params.id,
    ...collegeScope(req.user),
  });
  if (!drive || drive.status === "Draft")
    throw new ApiError(404, "Drive not found.");
  if (req.user.role !== "student")
    throw new ApiError(403, "Only students can apply.");
  const result = eligibility(req.user, drive);
  if (!result.eligible) throw new ApiError(400, result.reasons.join(" "));
  if (!req.user.resumeUrl)
    throw new ApiError(
      400,
      "Add your resume link in your profile before applying.",
    );
  const { name, email, branch, cgpa, graduationYear, backlogs, resumeUrl } =
    req.user;
  const application = await Application.create({
    student: req.user._id,
    collegeId: req.user.collegeId,
    drive: drive._id,
    snapshot: {
      name,
      email,
      branch,
      cgpa,
      graduationYear,
      backlogs,
      resumeUrl,
    },
    history: [{ status: "Applied", note: "Application submitted." }],
  });
  res.status(201).json({ application });
};
