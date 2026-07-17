const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    visitTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "cancelled", "completed"],
      default: "scheduled",
    },
    // Optional reason for cancellation
    reason: {
      type: String,
      default: "",
    },
    ownerRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Conflict detection index — prevents double-booking same slot
bookingSchema.index({ propertyId: 1, visitDate: 1, visitTime: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
