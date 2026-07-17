const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { validateRegister, validateLogin } = require("../middlewares/validate.middleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Auth API prefix: /api/v1/auth
router.post("/register", upload.single("profileImage"), validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/logout", logoutUser);
router.post("/refresh", refreshAccessToken);

// Email verification
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

// Password recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
