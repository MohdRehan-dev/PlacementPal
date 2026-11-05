require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const createApp = require("./app");
async function start() {
  if (!process.env.MONGODB_URI)
    throw new Error("Set MONGODB_URI in server/.env.");
  if (
    process.env.NODE_ENV === "production" &&
    !/^https:\/\//.test(process.env.APP_ORIGIN || "")
  )
    throw new Error("Set APP_ORIGIN to the production HTTPS URL.");
  await mongoose.connect(process.env.MONGODB_URI);
  const server = createApp().listen(process.env.PORT || 3000, () =>
    console.log(`PlacementPal API ready on port ${process.env.PORT || 3000}`),
  );
  const stop = () =>
    server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
start().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
