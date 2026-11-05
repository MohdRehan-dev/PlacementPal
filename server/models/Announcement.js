const mongoose = require("mongoose");
const { collegeIdField } = require("../utils/college");
module.exports = mongoose.model(
  "Announcement",
  new mongoose.Schema(
    {
      collegeId: collegeIdField,
      title: { type: String, required: true },
      body: { type: String, required: true },
      category: {
        type: String,
        enum: ["Update", "Preparation", "Important"],
        default: "Update",
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    { timestamps: true },
  ),
);
