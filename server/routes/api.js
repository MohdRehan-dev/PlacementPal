const { collegeScope } = require("../utils/college");
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  validate,
  validateProfile,
  schemas,
  validId,
} = require("../middleware/validate");
const wrap = require("../utils/wrapAsync");
const auth = require("../controllers/auth");
const drives = require("../controllers/drives");
const apps = require("../controllers/applications");
const Announcement = require("../models/Announcement");
const User = require("../models/User");
router.param("id", validId);
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Try again later." },
});
router.post(
  "/auth/signup",
  authLimit,
  validate(schemas.signup),
  wrap(auth.signup),
);
router.post(
  "/auth/login",
  authLimit,
  validate(schemas.login),
  wrap(auth.login),
);
router.use(requireAuth);
router.get("/auth/me", (req, res) => res.json({ user: req.user }));
router.post("/auth/logout", wrap(auth.logout));
router.patch("/profile", validateProfile, wrap(auth.profile));
router.get("/drives", wrap(drives.list));
router.post(
  "/drives",
  requireAdmin,
  validate(schemas.drive),
  wrap(drives.create),
);
router.patch(
  "/drives/:id",
  requireAdmin,
  validate(schemas.drive),
  wrap(drives.update),
);
router.post("/drives/:id/apply", wrap(drives.apply));
router.get("/applications", wrap(apps.list));
router.get("/applications/export", requireAdmin, wrap(apps.exportCsv));
router.patch(
  "/applications/:id/status",
  requireAdmin,
  validate(schemas.status),
  wrap(apps.update),
);
router.post("/applications/:id/withdraw", wrap(apps.withdraw));
router.get(
  "/students",
  requireAdmin,
  wrap(async (req, res) =>
    res.json({
      students: await User.find({
        ...collegeScope(req.user),
        role: "student",
      }).sort({ name: 1 }),
    }),
  ),
);
router.get(
  "/announcements",
  wrap(async (req, res) =>
    res.json({
      announcements: await Announcement.find(collegeScope(req.user))
        .sort({ createdAt: -1 })
        .limit(100),
    }),
  ),
);
router.post(
  "/announcements",
  requireAdmin,
  validate(schemas.announcement),
  wrap(async (req, res) =>
    res.status(201).json({
      announcement: await Announcement.create({
        ...req.body,
        createdBy: req.user._id,
        collegeId: req.user.collegeId,
      }),
    }),
  ),
);
module.exports = router;
