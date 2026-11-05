const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const ApiError = require("./utils/ApiError");
function createApp({
  secret = process.env.JWT_SECRET,
  production = process.env.NODE_ENV === "production",
} = {}) {
  if (!secret || secret.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  const app = express();
  app.locals.jwtSecret = secret;
  app.locals.production = production;
  if (production) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "data:"],
          "style-src": ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  // Same-origin deployment + strict origin checks protect cookie-authenticated writes.
  app.use("/api", (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const origin = req.get("origin");
    if (origin && origin !== process.env.APP_ORIGIN)
      return next(new ApiError(403, "Request origin is not allowed."));
    if (req.get("sec-fetch-site") === "cross-site")
      return next(new ApiError(403, "Cross-site requests are not allowed."));
    if (!req.is("application/json"))
      return next(new ApiError(415, "Send requests as application/json."));
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { message: "Too many requests. Please wait a minute." },
    }),
  );
  app.use(cookieParser());
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api", require("./routes/api"));
  app.use("/api", (req, res, next) =>
    next(new ApiError(404, "API endpoint not found.")),
  );
  if (production) {
    app.use(express.static(path.join(__dirname, "../client/dist")));
    app.get("*", (req, res) =>
      res.sendFile(path.join(__dirname, "../client/dist/index.html")),
    );
  }
  app.use((err, req, res, next) => {
    if (err.code === 11000)
      return res
        .status(409)
        .json({
          message:
            "This record already exists. You can only apply once to each drive.",
        });
    const status =
      err.status ||
      (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500);
    if (status >= 500) console.error(err.name, err.message);
    res
      .status(status)
      .json({
        message:
          status >= 500
            ? "Something went wrong. Please try again."
            : err.message,
      });
  });
  return app;
}
module.exports = createApp;
