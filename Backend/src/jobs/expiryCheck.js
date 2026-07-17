const Property = require("../models/property.model");
const Booking = require("../models/booking.model");
const User = require("../models/user.model");
const { sendListingExpiredToOwner } = require("../services/email.service");

const runExpiryCheck = async () => {
  console.log("[Job] Running daily property listing expiry check...");
  try {
    const now = new Date();
    // Find available listings that have expired
    const expiredProperties = await Property.find({
      expiresAt: { $lt: now },
      listingStatus: "available",
    }).populate("ownerId", "name email");

    if (expiredProperties.length === 0) {
      console.log("[Job] No expired listings found.");
      return;
    }

    console.log(`[Job] Found ${expiredProperties.length} expired listings. Processing...`);

    for (const property of expiredProperties) {
      property.listingStatus = "hidden";
      await property.save();

      // Email owner
      if (property.ownerId && property.ownerId.email) {
        try {
          await sendListingExpiredToOwner(
            property.ownerId.email,
            property.ownerId.name,
            property.title
          );
        } catch (mailErr) {
          console.error(`[Job] Failed to send expiry email for property ${property._id}:`, mailErr.message);
        }
      }
    }

    const completedBookings = await Booking.updateMany(
      {
        status: "confirmed",
        visitDate: { $lt: now },
      },
      {
        $set: { status: "completed" },
      }
    );

    if (completedBookings.modifiedCount > 0) {
      console.log(`[Job] Auto-completed ${completedBookings.modifiedCount} confirmed bookings.`);
    }

    console.log("[Job] Expiry check completed successfully.");
  } catch (err) {
    console.error("[Job] Error in expiry check job:", err);
  }
};

module.exports = runExpiryCheck;
