const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./db/db");

// Load Environment Variables
dotenv.config();

const app = express();

// Database connection middleware for Serverless environment
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Middlewares
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(cookieParser());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from the configured FRONTEND_URL, any localhost, or no-origin (curl/Postman)
      const allowed = [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
      ];
      if (!origin || allowed.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS: origin not allowed → " + origin));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth rate limiter on sensitive routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many requests, try again later" },
});
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/forgot-password", authLimiter);

// Test Route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "RentConnect Server is running" });
});

app.get("/", (req, res) => {
  res.json({ message: "RentConnect API", health: "/health" });
});

// Mount Routes (Versioned to v1, redundant search route removed)
app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/v1/user", require("./routes/user.routes"));
app.use("/api/v1/property", require("./routes/property.routes"));
app.use("/api/v1/chat", require("./routes/chat.routes"));
app.use("/api/v1/admin", require("./routes/admin.routes"));

// Error handling middleware (catches multer errors specifically)
app.use((err, req, res, next) => {
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "File too large. Maximum 5MB per image." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ success: false, message: "Too many files. Maximum 10 images." });
    }
  }
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong on the server",
  });
});

module.exports = app;
