const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },
    profileImage: {
      type: String,
      default: "",
    },
    // Email verification (replaces the old misused isVerified field)
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
    // Ban
    isBanned: {
      type: Boolean,
      default: false,
    },
    // Refresh token (hashed)
    refreshToken: String,
    // Password reset
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
  },
  { timestamps: true }
);

// Encrypt password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
