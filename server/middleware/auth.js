const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const wrapAsync = require("../utils/wrapAsync");
const AuthToken = require("../models/AuthToken");
const { verifyToken } = require("../utils/authToken");

exports.requireAuth = wrapAsync(async (req, res, next) => {
  let claims;
  try {
    claims = verifyToken(req);
  } catch {
    throw new ApiError(401, "Please sign in to continue.");
  }
  const active = await AuthToken.exists({
    tokenId: claims.jti,
    expiresAt: { $gt: new Date() },
  });
  if (!active)
    throw new ApiError(401, "Your login has expired. Please sign in again.");
  req.user = await User.findById(claims.sub);
  if (!req.user)
    throw new ApiError(401, "Please sign in to continue.");
  req.tokenId = claims.jti;
  next();
});
exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return next(new ApiError(403, "Placement officer access is required."));
  next();
};
