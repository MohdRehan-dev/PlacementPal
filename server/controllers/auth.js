const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const AuthToken = require("../models/AuthToken");
const { cookieName, cookieOptions, issueToken } = require("../utils/authToken");
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email }))
    throw new ApiError(409, "An account with this email already exists.");
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "student",
  });
  await issueToken(req, res, user);
  res.status(201).json({ user });
};
exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "+passwordHash",
  );
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
    throw new ApiError(401, "Email or password is incorrect.");
  await issueToken(req, res, user);
  res.json({ user });
};
exports.logout = async (req, res) => {
  await AuthToken.deleteOne({ tokenId: req.tokenId });
  res.clearCookie(cookieName, cookieOptions(req));
  res.json({ message: "Signed out." });
};
exports.profile = async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ user: req.user });
};
