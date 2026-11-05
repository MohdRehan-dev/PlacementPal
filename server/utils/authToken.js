const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const AuthToken = require("../models/AuthToken");

const cookieName = "placementpal.auth";
const lifetimeSeconds = 8 * 60 * 60;
const claims = { issuer: "placementpal", audience: "placementpal-web" };

function cookieOptions(req) {
  return { httpOnly: true, secure: req.app.locals.production, sameSite: "lax", path: "/" };
}

async function issueToken(req, res, user) {
  const tokenId = randomUUID();
  const token = jwt.sign({}, req.app.locals.jwtSecret, {
    ...claims,
    algorithm: "HS256",
    subject: user.id,
    jwtid: tokenId,
    expiresIn: lifetimeSeconds,
  });
  await AuthToken.create({
    tokenId,
    expiresAt: new Date(jwt.decode(token).exp * 1000),
  });
  res.cookie(cookieName, token, { ...cookieOptions(req), maxAge: lifetimeSeconds * 1000 });
}

function verifyToken(req) {
  return jwt.verify(req.cookies[cookieName], req.app.locals.jwtSecret, {
    ...claims,
    algorithms: ["HS256"],
  });
}

module.exports = { cookieName, cookieOptions, issueToken, verifyToken };
