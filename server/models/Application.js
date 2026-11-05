const mongoose = require("mongoose");
const { collegeIdField } = require("../utils/college");
const stages = [
  "Applied",
  "Shortlisted",
  "Assessment",
  "Interview",
  "Offered",
  "Rejected",
  "Withdrawn",
];
const applicationSchema = new mongoose.Schema(
  {
    collegeId: collegeIdField,
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drive",
      required: true,
    },
    status: { type: String, enum: stages, default: "Applied" },
    // Preserve what the student submitted even when their profile changes later.
    snapshot: {
      name: String,
      email: String,
      branch: String,
      cgpa: Number,
      graduationYear: Number,
      backlogs: Number,
      resumeUrl: String,
    },
    history: [
      {
        status: { type: String, enum: stages },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });
module.exports = mongoose.model("Application", applicationSchema);
module.exports.stages = stages;
