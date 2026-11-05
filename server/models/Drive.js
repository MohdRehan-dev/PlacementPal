const mongoose = require("mongoose");
const { collegeIdField } = require("../utils/college");
const driveSchema = new mongoose.Schema(
  {
    collegeId: collegeIdField,
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    workMode: {
      type: String,
      enum: ["On-site", "Hybrid", "Remote"],
      default: "On-site",
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Internship"],
      default: "Full-time",
    },
    ctcMin: { type: Number, required: true, min: 0 },
    ctcMax: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    skills: [String],
    minCgpa: { type: Number, default: 6 },
    maxBacklogs: { type: Number, default: 0 },
    branches: [String],
    graduationYears: [Number],
    deadline: { type: Date, required: true },
    driveDate: { type: Date, required: true },
    rounds: {
      type: [String],
      default: ["Aptitude test", "Technical interview", "HR interview"],
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Closed"],
      default: "Draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
driveSchema.index({ status: 1, deadline: 1 });
module.exports = mongoose.model("Drive", driveSchema);
