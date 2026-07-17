const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middlewares/auth.middleware");
const {
  getUserProfile,
  getUserById,
  updateUserProfile,
} = require("../controllers/auth.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/profile", protect, getUserProfile);
router.get("/:id", protect, getUserById);
router.put("/profile", protect, upload.single("profileImage"), updateUserProfile);

module.exports = router;
