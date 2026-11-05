const { test } = require("node:test");
const request = require("supertest");
const createApp = require("../app");
const app = createApp({
  secret: "test-secret-at-least-32-characters-long",
  production: false,
});
test("health endpoint is available without authentication", async () => {
  await request(app).get("/api/health").expect(200, { status: "ok" });
});
test("anonymous API requests receive JSON 401", async () => {
  await request(app)
    .get("/api/drives")
    .expect("Content-Type", /json/)
    .expect(401);
});
test("write endpoints reject cross-origin requests before database access", async () => {
  await request(app)
    .post("/api/auth/login")
    .set("Origin", "https://evil.test")
    .send({ email: "a@b.test", password: "password" })
    .expect(403);
});
test("write endpoints reject non-JSON bodies", async () => {
  await request(app)
    .post("/api/auth/login")
    .type("form")
    .send("email=a@b.test&password=password")
    .expect(415);
});
test("validation rejects empty login before database access", async () => {
  await request(app).post("/api/auth/login").send({}).expect(400);
});

test("expired and tampered JWT cookies receive 401", async () => {
  const jwt = require("jsonwebtoken");
  const expired = jwt.sign({}, app.locals.jwtSecret, {
    issuer: "placementpal",
    audience: "placementpal-web",
    expiresIn: -1,
  });
  for (const token of [expired, expired + "tampered"]) {
    await request(app)
      .get("/api/auth/me")
      .set("Cookie", "placementpal.auth=" + token)
      .expect(401);
  }
});
