const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });
  }
  return transporter;
};

/**
 * Send an email.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[Email] EMAIL_USER or EMAIL_PASS not set — skipping email send.");
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from: `"RentConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
  } catch (err) {
    // Never crash the app because an email failed
    console.error("[Email] Failed to send:", err.message);
  }
};

// ── Email Templates ────────────────────────────────────────────────────────────

const sendBookingNotificationToOwner = async (ownerEmail, ownerName, tenantName, propertyTitle, visitDate, visitTime) => {
  const dateStr = new Date(visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  await sendEmail(
    ownerEmail,
    `RentConnect — New Visit Scheduled for "${propertyTitle}"`,
    `<h2>New Visit Request</h2>
    <p>Hi ${ownerName},</p>
    <p><strong>${tenantName}</strong> has scheduled a visit to your property <strong>"${propertyTitle}"</strong>.</p>
    <table style="border-collapse:collapse;margin-top:16px;">
      <tr><td style="padding:8px;font-weight:600;color:#666;">Date:</td><td style="padding:8px;">${dateStr}</td></tr>
      <tr><td style="padding:8px;font-weight:600;color:#666;">Time:</td><td style="padding:8px;">${visitTime}</td></tr>
    </table>
    <p style="margin-top:16px;">Log in to RentConnect to confirm or cancel this visit.</p>`
  );
};

const sendBookingConfirmedToTenant = async (tenantEmail, tenantName, propertyTitle, visitDate, visitTime, placeDetails = "") => {
  const dateStr = new Date(visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  await sendEmail(
    tenantEmail,
    `RentConnect — Your Visit to "${propertyTitle}" is Confirmed`,
    `<h2>Visit Confirmed!</h2>
    <p>Hi ${tenantName},</p>
    <p>Your visit to <strong>"${propertyTitle}"</strong> has been confirmed by the owner.</p>
    <table style="border-collapse:collapse;margin-top:16px;">
      <tr><td style="padding:8px;font-weight:600;color:#666;">Date:</td><td style="padding:8px;">${dateStr}</td></tr>
      <tr><td style="padding:8px;font-weight:600;color:#666;">Time:</td><td style="padding:8px;">${visitTime}</td></tr>
    </table>
    ${placeDetails ? `<p style="margin-top:16px;"><strong>Visit place:</strong> ${placeDetails}</p>` : ""}`
  );
};

const sendBookingCancelledToTenant = async (tenantEmail, tenantName, propertyTitle, reason) => {
  await sendEmail(
    tenantEmail,
    `RentConnect — Your Visit to "${propertyTitle}" was Cancelled`,
    `<h2>Visit Cancelled</h2>
    <p>Hi ${tenantName},</p>
    <p>Unfortunately, the owner has cancelled your visit to <strong>"${propertyTitle}"</strong>.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    <p>You can browse other available properties on RentConnect.</p>`
  );
};

const sendListingExpiredToOwner = async (ownerEmail, ownerName, propertyTitle) => {
  await sendEmail(
    ownerEmail,
    `RentConnect — Your listing "${propertyTitle}" has been hidden`,
    `<h2>Listing Expired</h2>
    <p>Hi ${ownerName},</p>
    <p>Your listing <strong>"${propertyTitle}"</strong> has been automatically hidden after 60 days of being active.</p>
    <p>Log in to your dashboard to renew the listing and make it visible again.</p>`
  );
};

module.exports = {
  sendEmail,
  sendBookingNotificationToOwner,
  sendBookingConfirmedToTenant,
  sendBookingCancelledToTenant,
  sendListingExpiredToOwner,
};
