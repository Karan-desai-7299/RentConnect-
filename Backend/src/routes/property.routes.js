const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect, authorize } = require("../middlewares/auth.middleware");
const { validatePropertyCreate, validateBooking } = require("../middlewares/validate.middleware");
const {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  toggleFavorite,
  getFavorites,
  bookVisit,
  confirmBooking,
  cancelBooking,
  deleteBooking,
  reportProperty,
  getBookings,
  markBookingsRead,
  getOwnerAnalytics,
  renewListing,
  getReviews,
  createReview,
} = require("../controllers/property.controller");

// Set up Multer for handling multipart/form-data images in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Property general search/explore
router.get("/", getProperties);

// Owner analytics dashboard
router.get("/owner/analytics", protect, authorize("owner", "admin"), getOwnerAnalytics);

// User-specific properties/bookings/favorites
router.get("/user/favorites", protect, getFavorites);
router.get("/user/bookings", protect, getBookings);
router.put("/user/bookings/read", protect, authorize("owner", "admin"), markBookingsRead);

// Create Property (duplicate /create removed, now uses upload validation)
router.post("/", protect, authorize("owner", "admin"), upload.array("images", 10), validatePropertyCreate, createProperty);

// Favorites toggler
router.post("/user/favorites/:propertyId", protect, toggleFavorite);

// Visit scheduling & reporting
router.post("/:id/book", protect, validateBooking, bookVisit);
router.post("/:id/report", protect, reportProperty);

// Owner actions on visit bookings
router.put("/bookings/:bookingId/confirm", protect, authorize("owner", "admin"), confirmBooking);
router.put("/bookings/:bookingId/cancel", protect, authorize("owner", "admin"), cancelBooking);
router.delete("/bookings/:bookingId", protect, authorize("owner", "admin"), deleteBooking);

// Renew Listing status (60-day listing extension)
router.put("/:id/renew", protect, authorize("owner", "admin"), renewListing);

// Review routes
router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", protect, createReview);

// Basic CRUD for property id
router.get("/:id", getPropertyById);
router.put("/:id", protect, authorize("owner", "admin"), updateProperty);
router.delete("/:id", protect, authorize("owner", "admin"), deleteProperty);

module.exports = router;
