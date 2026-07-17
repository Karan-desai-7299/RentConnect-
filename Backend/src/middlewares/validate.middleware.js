const { body, query, validationResult } = require("express-validator");

/**
 * Middleware: runs after validator chains to collect errors and return 422.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validators ────────────────────────────────────────────────────────────

const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("role")
    .optional()
    .isIn(["user", "owner"])
    .withMessage("Role must be user or owner"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .optional({ checkFalsy: true })
    .matches(/^\d{7,15}$/)
    .withMessage("Phone must be 7-15 digits"),
  handleValidationErrors,
];

const validateLogin = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// ── Property validators ────────────────────────────────────────────────────────

const validatePropertyCreate = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required"),
  body("rent")
    .isFloat({ min: 1 })
    .withMessage("Rent must be a positive number"),
  body("deposit")
    .isFloat({ min: 0 })
    .withMessage("Deposit must be a non-negative number"),
  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  handleValidationErrors,
];

// ── Booking validators ─────────────────────────────────────────────────────────

const validateBooking = [
  body("visitDate")
    .isISO8601()
    .withMessage("visitDate must be a valid date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("visitDate must be in the future");
      }
      return true;
    }),
  body("visitTime").notEmpty().withMessage("visitTime is required"),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePropertyCreate,
  validateBooking,
  handleValidationErrors,
};
