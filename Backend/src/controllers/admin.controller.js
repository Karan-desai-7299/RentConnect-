const User = require("../models/user.model");
const Property = require("../models/property.model");
const Report = require("../models/report.model");
const Favorite = require("../models/favorite.model");
const Booking = require("../models/booking.model");
const Review = require("../models/review.model");
const { deleteImages } = require("../services/storage.service");
const { success, error } = require("../utils/apiResponse");

// @desc    Get admin statistics and reports
// @route   GET /api/v1/admin/dashboard
// @access  Private (Admin)
const getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalOwners, totalProperties, totalReports] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "owner" }),
      Property.countDocuments({}),
      Report.countDocuments({ status: "pending" }),
    ]);

    const popularProperties = await Property.find({})
      .sort({ viewsCount: -1 })
      .limit(5)
      .populate("ownerId", "name email phone");

    const reports = await Report.find({ status: "pending" })
      .populate("reporterId", "name email")
      .populate({
        path: "propertyId",
        populate: { path: "ownerId", select: "name email phone" },
      })
      .sort({ createdAt: -1 });

    return success(res, {
      stats: { totalUsers, totalOwners, totalProperties, totalReports },
      popularProperties,
      reports,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Get user list with optional search and role filter
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (role && ["user", "owner", "admin"].includes(role)) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken -resetPasswordToken -emailVerificationToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    return success(res, { users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Ban or unban a user
// @route   PUT /api/v1/admin/users/:id/ban
// @access  Private (Admin)
const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, "User not found", 404);
    if (user.role === "admin") return error(res, "Cannot ban an admin user", 400);

    user.isBanned = !user.isBanned;
    await user.save();

    return success(res, {
      message: `User ${user.name} has been ${user.isBanned ? "banned" : "unbanned"}`,
      isBanned: user.isBanned,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Promote/demote user role
// @route   PUT /api/v1/admin/users/:id/role
// @access  Private (Admin)
const setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "owner"].includes(role)) {
      return error(res, "Role must be 'user' or 'owner'", 400);
    }
    const user = await User.findById(req.params.id);
    if (!user) return error(res, "User not found", 404);
    if (user.role === "admin") return error(res, "Cannot change admin role", 400);

    user.role = role;
    await user.save();
    return success(res, { message: `User role updated to ${role}`, user: { _id: user._id, role: user.role } });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Verify a property listing (admin only)
// @route   PUT /api/v1/admin/property/:id/verify
// @access  Private (Admin)
const verifyProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { isVerifiedProperty: true },
      { new: true }
    );
    if (!property) return error(res, "Property not found", 404);
    return success(res, { message: "Property verified", isVerifiedProperty: true });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Resolve report and delete reported listing (Bug 5 fix: full cascade)
// @route   DELETE /api/v1/admin/property/:id
// @access  Private (Admin)
const deleteReportedProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const property = await Property.findById(propertyId);
    if (!property) return error(res, "Property not found", 404);

    // Bug 5 fix: full cascade delete (was missing Favorite and Booking)
    await Promise.all([
      Property.findByIdAndDelete(propertyId),
      Report.updateMany({ propertyId }, { $set: { status: "resolved" } }),
      Favorite.deleteMany({ propertyId }),
      Booking.deleteMany({ propertyId }),
      Review.deleteMany({ propertyId }),
      deleteImages(property.imageFileIds || []),
    ]);

    return success(res, { message: "Reported property and all related data deleted successfully" });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Delete a review
// @route   DELETE /api/v1/admin/reviews/:id
// @access  Private (Admin)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return error(res, "Review not found", 404);
    return success(res, { message: "Review deleted" });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  banUser,
  setUserRole,
  verifyProperty,
  deleteReportedProperty,
  deleteReview,
};
