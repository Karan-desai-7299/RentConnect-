const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  getAdminDashboard,
  getUsers,
  banUser,
  setUserRole,
  verifyProperty,
  deleteReportedProperty,
  deleteReview,
} = require("../controllers/admin.controller");

router.use(protect);
router.use(authorize("admin"));

router.get("/dashboard", getAdminDashboard);
router.get("/users", getUsers);
router.put("/users/:id/ban", banUser);
router.put("/users/:id/role", setUserRole);
router.put("/property/:id/verify", verifyProperty);
router.delete("/property/:id", deleteReportedProperty);
router.delete("/reviews/:id", deleteReview);

module.exports = router;
