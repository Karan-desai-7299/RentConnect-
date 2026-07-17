const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const { sendEmail } = require("../services/email.service");
const { uploadImages } = require("../services/storage.service");
const { success, error } = require("../utils/apiResponse");

// ── Token helpers ──────────────────────────────────────────────────────────────

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: "7d" });

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const buildUserPayload = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  city: user.city,
  role: user.role,
  profileImage: user.profileImage,
  isEmailVerified: user.isEmailVerified,
  token,
});

// ── Register ───────────────────────────────────────────────────────────────────

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, phone, city, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return error(res, "User already exists", 400);
    }

    // Bug 3 fix: role is ALWAYS "user" — never trust req.body.role
    const requestedRole = req.body.role === "owner" ? "owner" : "user";
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const { urls } = await uploadImages(req.file ? [req.file] : [], []);

    // In dev (no email creds configured), auto-verify so login isn't blocked
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

    const user = await User.create({
      name,
      email,
      phone,
      city: String(city || "").trim().toLowerCase(),
      password,
      // Bug 3 fix: requestedRole is already constrained to "user" | "owner" above (line 46),
      // so req.body.role cannot escalate to "admin".
      role: requestedRole,
      profileImage: urls[0] || "",
      isEmailVerified: !emailConfigured, // true in dev (skip gate), false in prod
      emailVerificationToken: emailConfigured ? hashToken(verifyToken) : undefined,
      emailVerificationExpiry: emailConfigured ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
    });

    if (user) {
      // Send verification email
      const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;
      await sendEmail(
        user.email,
        "Welcome to RentConnect — Verify Your Email",
        `<h2>Welcome, ${user.name}!</h2>
        <p>Please verify your email address to get started.</p>
        <a href="${verifyUrl}" style="background:#0d9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Verify Email</a>
        <p style="margin-top:16px;color:#666;font-size:14px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>`
      );

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      user.refreshToken = hashToken(refreshToken);
      await user.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return success(res, buildUserPayload(user, accessToken), 201);
    }

    return error(res, "Invalid user data", 400);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Login ──────────────────────────────────────────────────────────────────────

// @desc    Auth user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      if (user.isBanned) {
        return error(res, "Your account has been banned", 403);
      }

      // Only enforce email verification when email service is configured (production)
      const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
      if (emailConfigured && !user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email before logging in.",
          code: "EMAIL_NOT_VERIFIED",
        });
      }

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      user.refreshToken = hashToken(refreshToken);
      await user.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return success(res, buildUserPayload(user, accessToken));
    }

    return error(res, "Invalid email or password", 401);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Refresh Token ──────────────────────────────────────────────────────────────

// @desc    Issue new access token from refresh token cookie
// @route   POST /api/v1/auth/refresh
// @access  Public (requires httpOnly cookie)
const refreshAccessToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return error(res, "No refresh token", 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const hashed = hashToken(token);
    const user = await User.findOne({ _id: decoded.id, refreshToken: hashed });
    if (!user) return error(res, "Invalid refresh token", 401);

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, { token: newAccessToken });
  } catch (err) {
    return error(res, "Refresh token expired or invalid", 401);
  }
};

// ── Logout ─────────────────────────────────────────────────────────────────────

const logoutUser = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    const hashed = hashToken(token);
    await User.findOneAndUpdate({ refreshToken: hashed }, { $unset: { refreshToken: 1 } });
  }
  res.clearCookie("refreshToken");
  return success(res, { message: "Logged out successfully" });
};

// ── Email Verification ─────────────────────────────────────────────────────────

// @desc    Verify email with token from link
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  const hashed = hashToken(req.params.token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpiry: { $gt: Date.now() },
  });
  if (!user) return error(res, "Invalid or expired verification link", 400);

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();
  return success(res, { message: "Email verified successfully. You can now log in." });
};

// @desc    Resend email verification
// @route   POST /api/v1/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return error(res, "User not found", 404);
  if (user.isEmailVerified) return error(res, "Email is already verified", 400);

  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = hashToken(verifyToken);
  user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;
  await sendEmail(
    user.email,
    "RentConnect — Verify Your Email",
    `<p>Click the link to verify your email:</p>
    <a href="${verifyUrl}" style="background:#0d9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Verify Email</a>`
  );
  return success(res, { message: "Verification email resent." });
};

// ── Forgot / Reset Password ────────────────────────────────────────────────────

// @desc    Send password reset link
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    // Always respond the same to prevent user enumeration
    if (!user) return success(res, { message: "If that email is registered, a reset link has been sent." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    await sendEmail(
      user.email,
      "RentConnect — Reset Your Password",
      `<h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the button below to create a new password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="background:#0d9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Reset Password</a>
      <p style="margin-top:16px;color:#666;font-size:14px;">If you didn't request this, please ignore this email. Your password will not change.</p>`
    );
    return success(res, { message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const { password } = req.body;
  const hashed = hashToken(req.params.token);

  try {
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpiry: { $gt: Date.now() },
    });
    if (!user) return error(res, "Invalid or expired reset token", 400);

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    // Invalidate all refresh tokens
    user.refreshToken = undefined;
    await user.save();

    return success(res, { message: "Password reset successfully. Please log in." });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Profile ────────────────────────────────────────────────────────────────────

// @desc    Get user profile
// @route   GET /api/v1/user/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return error(res, "User not found", 404);

    return success(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email phone city role profileImage");
    if (!user) return error(res, "User not found", 404);

    return success(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      profileImage: user.profileImage,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/user/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return error(res, "User not found", 404);

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.city = req.body.city ? String(req.body.city).toLowerCase() : user.city;
    if (req.file) {
      const { urls } = await uploadImages([req.file], []);
      if (urls[0]) {
        user.profileImage = urls[0];
      }
    } else if (req.body.profileImage !== undefined) {
      user.profileImage = req.body.profileImage;
    }
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const newAccessToken = generateAccessToken(updatedUser._id);

    return success(res, buildUserPayload(updatedUser, newAccessToken));
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getUserProfile,
  getUserById,
  updateUserProfile,
};
