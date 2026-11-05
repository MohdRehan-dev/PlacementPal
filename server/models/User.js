const mongoose = require("mongoose");
const { collegeIdField } = require("../utils/college");
const userSchema = new mongoose.Schema(
  {
    collegeId: collegeIdField,
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    branch: { type: String, default: "" },
    graduationYear: Number,
    cgpa: { type: Number, min: 0, max: 10 },
    backlogs: { type: Number, min: 0, default: 0 },
    preferredRoles: {
      type: [String],
      default: [],
      validate: {
        validator: (roles) => roles.length <= 4,
        message: "Choose up to four preferred roles.",
      },
    },
    experience: {
      type: [
        {
          _id: false,
          role: { type: String, required: true },
          company: { type: String, required: true },
          startDate: { type: String, required: true },
          endDate: String,
          description: String,
        },
      ],
      default: [],
    },
    projects: {
      type: [
        {
          _id: false,
          name: { type: String, required: true },
          description: String,
          liveUrl: { type: String, required: true },
          githubUrl: String,
        },
      ],
      default: [],
    },
    phone: { type: String, default: "" },
    skills: { type: [String], default: [] },
    resumeUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    college: { type: String, default: "Rizvi College of Engineering" },
  },
  { timestamps: true },
);
userSchema.set("toJSON", {
  transform: (_, user) => {
    delete user.passwordHash;
    delete user.__v;
    return user;
  },
});
module.exports = mongoose.model("User", userSchema);
