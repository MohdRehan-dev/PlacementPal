const mongoose = require("mongoose");

const authTokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = mongoose.model("AuthToken", authTokenSchema);
