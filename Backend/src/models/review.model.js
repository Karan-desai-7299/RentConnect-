const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// One review per user per property
reviewSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

// For fast average rating queries
reviewSchema.index({ propertyId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
