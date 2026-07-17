const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/db/db");
const socketHandler = require("./src/socket/socket");

// ── ImageKit env validation ────────────────────────────────────────────────────
// In production, ImageKit keys must be present — otherwise image uploads silently
// fall back to base64 data URLs which can bloat property documents past MongoDB's
// 16MB limit. In development, allow the fallback but warn the operator.
const imagekitKeys = [
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
];
const missingImagekitKeys = imagekitKeys.filter((k) => !process.env[k]);
if (missingImagekitKeys.length > 0) {
  const msg = `Missing ImageKit env vars: ${missingImagekitKeys.join(", ")}.`;
  if (process.env.NODE_ENV === "production") {
    console.error(`FATAL: ${msg} ImageKit is required in production.`);
    process.exit(1);
  }
  console.warn(`WARNING: ${msg} Image uploads will fall back to base64 storage.`);
}

// Connect to Database
const runExpiryCheck = require("./src/jobs/expiryCheck");

connectDB().then(() => {
  runExpiryCheck();
  setInterval(runExpiryCheck, 24 * 60 * 60 * 1000);
});

// Create HTTP server
const server = http.createServer(app);

// Allowed origins for Socket.io (must match app.js CORS config)
const allowedSocketOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
].filter(Boolean);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || allowedSocketOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Socket CORS: origin not allowed → " + origin));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Run socket server handler
socketHandler(io);

// Listing expiry check — runs once daily
// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`RentConnect Server running on port ${PORT}`);
});
