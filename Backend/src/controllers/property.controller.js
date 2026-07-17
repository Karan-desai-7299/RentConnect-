const Property = require("../models/property.model");
const Favorite = require("../models/favorite.model");
const Booking = require("../models/booking.model");
const Report = require("../models/report.model");
const Review = require("../models/review.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { uploadImages, deleteImages } = require("../services/storage.service");
const {
  sendBookingNotificationToOwner,
  sendBookingConfirmedToTenant,
  sendBookingCancelledToTenant,
} = require("../services/email.service");
const { success, error } = require("../utils/apiResponse");

// ── Utilities ──────────────────────────────────────────────────────────────────

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeLocation = (body) => {
  const lat = toNumber(body.latitude ?? body.lat);
  const lng = toNumber(body.longitude ?? body.lng);
  return { type: "Point", coordinates: [lng, lat] };
};

const getViewerFromRequest = async (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    return await User.findById(decoded.id).select("_id role");
  } catch {
    return null;
  }
};

// ── Create Property ────────────────────────────────────────────────────────────

const createProperty = async (req, res) => {
  try {
    const normalizedTitle = String(req.body.title || "").trim().toLowerCase();
    const normalizedAddress = String(req.body.address || "").trim().toLowerCase();
    const normalizedCity = String(req.body.city || "").trim().toLowerCase();

    const duplicate = await Property.findOne({
      ownerId: req.user._id,
      title: normalizedTitle,
      address: normalizedAddress,
      city: normalizedCity,
    });
    if (duplicate) {
      return error(res, "A similar listing already exists for this owner.", 409);
    }

    const { urls: images, fileIds: imageFileIds } = await uploadImages(
      req.files,
      req.body.images ? [].concat(req.body.images) : []
    );

    if ((req.files?.length || 0) > 0 && images.length === 0) {
      return error(
        res,
        "Unable to process the uploaded images. Please reupload clear JPG or PNG files.",
        400
      );
    }

    // Set expiry to 60 days from now
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const property = await Property.create({
      ownerId: req.user._id,
      title: req.body.title,
      propertyType: req.body.propertyType,
      address: req.body.address,
      city: normalizedCity,
      area: req.body.area || "",
      pinCode: req.body.pinCode || req.body.pincode || "",
      location: normalizeLocation(req.body),
      rent: toNumber(req.body.rent),
      deposit: toNumber(req.body.deposit),
      bedrooms: toNumber(req.body.bedrooms),
      bathrooms: toNumber(req.body.bathrooms),
      furnishedStatus: req.body.furnishedStatus,
      genderPreference: req.body.genderPreference || "any",
      availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : new Date(),
      amenities: Array.isArray(req.body.amenities)
        ? req.body.amenities
        : String(req.body.amenities || "").split(",").filter(Boolean),
      contactNumber: req.body.contactNumber || req.body.phone || "",
      description: req.body.description || "",
      images,
      imageFileIds,
      video: req.body.video || "",
      listingStatus: req.body.listingStatus || "available",
      isVerifiedProperty: false, // Bug 6 fix: always false — admin must verify
      expiresAt,
    });

    return success(res, property, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Get Properties (with $geoNear, text search, pagination, filters) ───────────

const getProperties = async (req, res) => {
  try {
    const viewer = await getViewerFromRequest(req);
    const {
      city,
      propertyType,
      minRent,
      maxRent,
      bedrooms,
      furnishedStatus,
      amenities,
      ownerId,
      search,
      sort = "latest",
      lat,
      lng,
      maxDistance = 25,
      genderPreference,
      availableFrom,
      isVerifiedOnly,
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, toNumber(page, 1));
    const limitNum = Math.min(50, Math.max(1, toNumber(limit, 12)));
    const skip = (pageNum - 1) * limitNum;

    // When geolocation provided, use $geoNear aggregation (uses 2dsphere index)
    if (lat && lng) {
      const userLat = toNumber(lat);
      const userLng = toNumber(lng);
      const maxDistMeters = toNumber(maxDistance, 25) * 1000;

      const matchStage = {};
      if (city) matchStage.city = String(city).toLowerCase();
      if (propertyType && propertyType !== "all") matchStage.propertyType = propertyType;
      if (bedrooms && bedrooms !== "all") matchStage.bedrooms = toNumber(bedrooms);
      if (furnishedStatus && furnishedStatus !== "all") matchStage.furnishedStatus = furnishedStatus;
      if (ownerId) matchStage.ownerId = require("mongoose").Types.ObjectId.createFromHexString(ownerId);
      if (!ownerId) matchStage.listingStatus = { $nin: ["hidden", "draft"] };
      if (genderPreference && genderPreference !== "all") matchStage.genderPreference = genderPreference;
      if (isVerifiedOnly === "true") matchStage.isVerifiedProperty = true;
      if (availableFrom) matchStage.availableFrom = { $lte: new Date(availableFrom) };
      if (amenities) {
        const list = String(amenities).split(",").filter(Boolean);
        matchStage.amenities = { $all: list };
      }
      if (minRent || maxRent) {
        matchStage.rent = {};
        if (minRent) matchStage.rent.$gte = toNumber(minRent);
        if (maxRent) matchStage.rent.$lte = toNumber(maxRent);
      }
      if (search) {
        matchStage.$text = { $search: search };
      }

      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [userLng, userLat] },
            distanceField: "distanceMeters",
            maxDistance: maxDistMeters,
            spherical: true,
            query: matchStage,
          },
        },
        {
          $addFields: {
            distanceKm: { $round: [{ $divide: ["$distanceMeters", 1000] }, 2] },
            estimatedTravelMinutes: {
              $max: [5, { $round: [{ $multiply: [{ $divide: ["$distanceMeters", 1000] }, 4] }] }],
            },
          },
        },
        { $sort: { distanceMeters: 1 } },
        {
          $facet: {
            properties: [
              { $skip: skip },
              { $limit: limitNum },
              {
                $lookup: {
                  from: "users",
                  localField: "ownerId",
                  foreignField: "_id",
                  as: "ownerId",
                  pipeline: [
                    {
                      $project: viewer
                        ? { name: 1, email: 1, phone: 1, profileImage: 1, role: 1 }
                        : { name: 1, email: 1, profileImage: 1, role: 1 },
                    },
                  ],
                },
              },
              { $unwind: { path: "$ownerId", preserveNullAndEmptyArrays: true } },
            ],
            total: [{ $count: "count" }],
          },
        },
      ];

      const [result] = await Property.aggregate(pipeline);
      const properties = result?.properties || [];
      const total = result?.total?.[0]?.count || 0;

      if (!viewer) {
        properties.forEach((p) => delete p.contactNumber);
      }

      return success(res, {
        properties,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    // ── Standard query (no geo) ──
    const query = {};
    if (city) query.city = String(city).toLowerCase();
    if (propertyType && propertyType !== "all") query.propertyType = propertyType;
    if (bedrooms && bedrooms !== "all") query.bedrooms = toNumber(bedrooms);
    if (furnishedStatus && furnishedStatus !== "all") query.furnishedStatus = furnishedStatus;
    if (ownerId) query.ownerId = ownerId;
    if (!ownerId) query.listingStatus = { $nin: ["hidden", "draft"] };
    if (genderPreference && genderPreference !== "all") query.genderPreference = genderPreference;
    if (isVerifiedOnly === "true") query.isVerifiedProperty = true;
    if (availableFrom) query.availableFrom = { $lte: new Date(availableFrom) };
    if (amenities) {
      const list = String(amenities).split(",").filter(Boolean);
      query.amenities = { $all: list };
    }
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = toNumber(minRent);
      if (maxRent) query.rent.$lte = toNumber(maxRent);
    }
    // Switch from $regex to $text for performance
    if (search) {
      query.$text = { $search: search };
    }

    const projection = {
      ownerId: 1, title: 1, propertyType: 1, address: 1, city: 1, area: 1,
      pinCode: 1, rent: 1, deposit: 1, bedrooms: 1, bathrooms: 1,
      furnishedStatus: 1, amenities: 1, description: 1, images: 1, location: 1,
      createdAt: 1, viewsCount: 1, listingStatus: 1, isVerifiedProperty: 1,
      genderPreference: 1, availableFrom: 1,
    };
    if (viewer) projection.contactNumber = 1;

    const sortMap = {
      latest: { createdAt: -1 },
      lowestPrice: { rent: 1 },
    };
    const sortQuery = sortMap[sort] || sortMap.latest;

    const ownerSelect = viewer
      ? "name email phone profileImage role"
      : "name email profileImage role";

    const [properties, total] = await Promise.all([
      Property.find(query)
        .select(projection)
        .populate("ownerId", ownerSelect)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Property.countDocuments(query),
    ]);

    if (!viewer) {
      properties.forEach((p) => delete p.contactNumber);
    }

    return success(res, {
      properties,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Get Property By ID ─────────────────────────────────────────────────────────

const getPropertyById = async (req, res) => {
  try {
    const viewer = await getViewerFromRequest(req);
    const ownerSelect = viewer ? "name email phone profileImage role" : "name email profileImage role";
    const property = await Property.findById(req.params.id)
      .populate("ownerId", ownerSelect)
      .lean();
    if (!property) return error(res, "Property not found", 404);

    await Property.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    if (!viewer) delete property.contactNumber;

    // Get average rating
    const ratingAgg = await Review.aggregate([
      { $match: { propertyId: property._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const rating = ratingAgg[0] ? { average: ratingAgg[0].avg.toFixed(1), count: ratingAgg[0].count } : { average: 0, count: 0 };

    return success(res, { ...property, viewsCount: (property.viewsCount || 0) + 1, rating });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Update Property ────────────────────────────────────────────────────────────

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return error(res, "Property not found", 404);
    if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return error(res, "Not authorized to update this listing", 403);
    }

    const payload = { ...req.body };
    if (req.body.latitude || req.body.longitude || req.body.lat || req.body.lng) {
      payload.location = normalizeLocation(req.body);
    }
    if (payload.city) payload.city = String(payload.city).toLowerCase();
    if (payload.amenities && !Array.isArray(payload.amenities)) {
      payload.amenities = String(payload.amenities).split(",").filter(Boolean);
    }
    // Prevent isVerifiedProperty from being set via this endpoint (admin-only)
    delete payload.isVerifiedProperty;

    const updated = await Property.findByIdAndUpdate(req.params.id, payload, { new: true })
      .populate("ownerId", "name email phone profileImage role");
    return success(res, updated);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Delete Property ────────────────────────────────────────────────────────────

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return error(res, "Property not found", 404);
    if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return error(res, "Not authorized to delete this listing", 403);
    }

    // Cascade delete
    await Promise.all([
      Property.findByIdAndDelete(req.params.id),
      Favorite.deleteMany({ propertyId: req.params.id }),
      Booking.deleteMany({ propertyId: req.params.id }),
      Report.deleteMany({ propertyId: req.params.id }),
      Review.deleteMany({ propertyId: req.params.id }),
      // Clean up images from ImageKit
      deleteImages(property.imageFileIds || []),
    ]);

    return success(res, { message: "Property removed successfully" });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Favorites ──────────────────────────────────────────────────────────────────

const toggleFavorite = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const favorite = await Favorite.findOne({ userId: req.user._id, propertyId });
    if (favorite) {
      await Favorite.deleteOne({ _id: favorite._id });
      return success(res, { favorited: false, message: "Removed from favorites" });
    }
    await Favorite.create({ userId: req.user._id, propertyId });
    return success(res, { favorited: true, message: "Added to favorites" });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate({
        path: "propertyId",
        populate: { path: "ownerId", select: "name email phone profileImage role" },
      })
      .lean();
    return success(res, favorites.map((item) => item.propertyId).filter(Boolean));
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Bookings ───────────────────────────────────────────────────────────────────

const bookVisit = async (req, res) => {
  try {
    const { visitDate, visitTime } = req.body;
    const propertyId = req.params.id;

    // Conflict detection: prevent double-booking same slot
    const conflict = await Booking.findOne({
      propertyId,
      visitDate: new Date(visitDate),
      visitTime,
      status: "scheduled",
    });
    if (conflict) {
      return error(res, "This time slot is already booked. Please choose a different time.", 409);
    }

    const booking = await Booking.create({
      userId: req.user._id,
      propertyId,
      visitDate: new Date(visitDate),
      visitTime,
      ownerRead: false,
    });

    // Notify owner by email
    try {
      const property = await Property.findById(propertyId).populate("ownerId", "name email");
      if (property?.ownerId) {
        await sendBookingNotificationToOwner(
          property.ownerId.email,
          property.ownerId.name,
          req.user.name,
          property.title,
          visitDate,
          visitTime
        );
      }
    } catch (e) {
      console.error("Email notification failed:", e.message);
    }

    return success(res, booking, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("propertyId", "title ownerId address area city pinCode")
      .populate("userId", "name email");
    if (!booking) return error(res, "Booking not found", 404);
    if (booking.propertyId.ownerId.toString() !== req.user._id.toString()) {
      return error(res, "Not authorized", 403);
    }

    booking.status = "confirmed";
    await booking.save();

    const placeDetails = [booking.propertyId?.address, booking.propertyId?.area, booking.propertyId?.city, booking.propertyId?.pinCode]
      .filter(Boolean)
      .join(", ");

    // Notify tenant
    await sendBookingConfirmedToTenant(
      booking.userId.email,
      booking.userId.name,
      booking.propertyId.title,
      booking.visitDate,
      booking.visitTime,
      placeDetails
    );

    return success(res, { message: "Booking confirmed", booking });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("propertyId", "title ownerId")
      .populate("userId", "name email");
    if (!booking) return error(res, "Booking not found", 404);
    if (booking.propertyId.ownerId.toString() !== req.user._id.toString()) {
      return error(res, "Not authorized", 403);
    }

    booking.status = "cancelled";
    booking.reason = req.body.reason || "";
    await booking.save();

    // Notify tenant
    await sendBookingCancelledToTenant(
      booking.userId.email,
      booking.userId.name,
      booking.propertyId.title,
      booking.reason
    );

    return success(res, { message: "Booking cancelled", booking });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("propertyId", "ownerId");
    if (!booking) return error(res, "Booking not found", 404);

    const isOwner = booking.propertyId && booking.propertyId.ownerId.toString() === req.user._id.toString();
    const isTenant = booking.userId && booking.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isTenant && !isAdmin) {
      return error(res, "Not authorized to delete this booking", 403);
    }

    await Booking.findByIdAndDelete(req.params.bookingId);
    return success(res, { message: "Booking removed successfully" });
  } catch (err) {
    return error(res, err.message, 500);
  }
};


const reportProperty = async (req, res) => {
  try {
    const report = await Report.create({
      reporterId: req.user._id,
      propertyId: req.params.id,
      reason: req.body.reason,
    });
    return success(res, report, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getBookings = async (req, res) => {
  try {
    let bookings;
    if (req.user.role === "owner") {
      const properties = await Property.find({ ownerId: req.user._id }).select("_id");
      const propertyIds = properties.map((p) => p._id);
      bookings = await Booking.find({ propertyId: { $in: propertyIds } })
        .populate("userId", "name email phone profileImage")
        .populate("propertyId", "title city area rent images")
        .sort({ visitDate: 1 });
    } else {
      bookings = await Booking.find({ userId: req.user._id })
        .populate({
          path: "propertyId",
          populate: { path: "ownerId", select: "name email phone" },
        })
        .sort({ visitDate: 1 });
    }
    return success(res, bookings);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const markBookingsRead = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return error(res, "Only owners can mark visit bookings as read", 403);
    }
    const properties = await Property.find({ ownerId: req.user._id }).select("_id");
    const propertyIds = properties.map((p) => p._id);
    const result = await Booking.updateMany(
      { propertyId: { $in: propertyIds }, ownerRead: false },
      { $set: { ownerRead: true } }
    );
    return success(res, { message: "Bookings marked as read", modifiedCount: result.modifiedCount || 0 });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Owner Analytics ────────────────────────────────────────────────────────────

const getOwnerAnalytics = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const properties = await Property.find({ ownerId }).select("_id viewsCount listingStatus");
    const propertyIds = properties.map((p) => p._id);

    const [scheduledCount, unreadCount] = await Promise.all([
      Booking.countDocuments({ propertyId: { $in: propertyIds }, status: { $in: ["scheduled", "confirmed"] } }),
      Booking.countDocuments({ propertyId: { $in: propertyIds }, ownerRead: false }),
    ]);

    const statusCounts = { available: 0, hidden: 0, rented: 0, draft: 0 };
    let totalViews = 0;
    for (const p of properties) {
      statusCounts[p.listingStatus] = (statusCounts[p.listingStatus] || 0) + 1;
      totalViews += p.viewsCount || 0;
    }

    return success(res, {
      totalListings: properties.length,
      statusCounts,
      totalViews,
      scheduledVisits: scheduledCount,
      unreadBookings: unreadCount,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Listing Renewal ────────────────────────────────────────────────────────────

const renewListing = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return error(res, "Property not found", 404);
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return error(res, "Not authorized", 403);
    }
    property.expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    property.listingStatus = "available";
    await property.save();
    return success(res, { message: "Listing renewed for 60 days", property });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Reviews ────────────────────────────────────────────────────────────────────

const getReviews = async (req, res) => {
  try {
    const page = Math.max(1, toNumber(req.query.page, 1));
    const limit = Math.min(20, toNumber(req.query.limit, 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ propertyId: req.params.id })
        .populate("userId", "name profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ propertyId: req.params.id }),
    ]);

    const agg = await Review.aggregate([
      { $match: { propertyId: require("mongoose").Types.ObjectId.createFromHexString(req.params.id) } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);

    return success(res, {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      averageRating: agg[0] ? Number(agg[0].avg.toFixed(1)) : 0,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const propertyId = req.params.id;

    // Require at least one completed booking for this property
    const hasBooking = await Booking.findOne({
      userId: req.user._id,
      propertyId,
      status: "completed",
    });
    if (!hasBooking) {
      return error(res, "You can only review properties you have visited.", 403);
    }

    const review = await Review.create({
      userId: req.user._id,
      propertyId,
      rating: toNumber(rating),
      comment,
    });
    await review.populate("userId", "name profileImage");
    return success(res, review, 201);
  } catch (err) {
    if (err.code === 11000) return error(res, "You have already reviewed this property.", 409);
    return error(res, err.message, 500);
  }
};

module.exports = {
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
};
