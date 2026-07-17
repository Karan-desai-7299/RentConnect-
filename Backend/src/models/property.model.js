const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
    },
    propertyType: {
      type: String,
      enum: ["flat", "room", "pg", "house"],
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    area: {
      type: String,
      required: true,
    },
    pinCode: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (v) => Array.isArray(v) && v.length === 2,
          message: "Location coordinates must contain [lng, lat]",
        },
      },
    },
    rent: {
      type: Number,
      required: true,
    },
    deposit: {
      type: Number,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    furnishedStatus: {
      type: String,
      enum: ["unfurnished", "semi-furnished", "fully-furnished"],
      required: true,
    },
    genderPreference: {
      type: String,
      enum: ["any", "male", "female"],
      default: "any",
    },
    availableFrom: {
      type: Date,
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    contactNumber: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length >= 1;
        },
        message: "A minimum of 1 image is required",
      },
    },
    // Parallel array to images — stores ImageKit fileId for deletion
    imageFileIds: {
      type: [String],
      default: [],
    },
    video: {
      type: String,
      default: "",
    },
    listingStatus: {
      type: String,
      enum: ["available", "rented", "hidden", "draft"],
      default: "available",
    },
    // Bug 6 fix: always false by default — admin must verify manually
    isVerifiedProperty: {
      type: Boolean,
      default: false,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    // Listing expiry: auto-hide after 60 days
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Geospatial index (already existed)
propertySchema.index({ location: "2dsphere" });

// Text index for full-text search (replaces $regex)
propertySchema.index({ title: "text", description: "text", area: "text", address: "text" });

// Compound indexes for common query patterns
propertySchema.index({ city: 1, listingStatus: 1 });
propertySchema.index({ ownerId: 1, listingStatus: 1 });
propertySchema.index({ rent: 1 });
propertySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Property", propertySchema);
