const jwt = require("jsonwebtoken");
const Message = require("../models/message.model");
const User = require("../models/user.model");

/**
 * Bug 4 fix: Verify JWT on socket handshake and use the verified userId
 * for all message sends. The client MUST pass a valid Bearer token in the
 * auth handshake — never trust senderId from the event payload.
 */
const socketHandler = (io) => {
  // Map of active userId -> socket.id
  const activeUsers = new Map();

  // Middleware: authenticate every socket connection via JWT
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) return next(new Error("Socket: no auth token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id isBanned");
      if (!user || user.isBanned) return next(new Error("Socket: unauthorized"));

      // Attach verified userId to socket for all subsequent events
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error("Socket: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Register user in active users map using verified userId
    activeUsers.set(socket.userId, socket.id);
    io.emit("getOnlineUsers", Array.from(activeUsers.keys()));

    // Send Message — Bug 4 fix: use socket.userId NOT payload.senderId
    socket.on("sendMessage", async ({ receiverId, text }) => {
      try {
        if (!receiverId || !text) return;

        const senderId = socket.userId; // verified server-side

        // Save message to Database
        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          text,
        });

        // Send to receiver if online
        const receiverSocketId = activeUsers.get(receiverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", message);
          io.to(receiverSocketId).emit("notification", {
            type: "message",
            senderId,
            message: `New message: ${text.slice(0, 30)}${text.length > 30 ? "..." : ""}`,
          });
        }

        // Send back to sender for confirmation/sync
        socket.emit("messageSent", message);
      } catch (err) {
        console.error("Socket sendMessage error:", err);
      }
    });

    // Typing Status
    socket.on("typing", ({ receiverId, isTyping }) => {
      const receiverSocketId = activeUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typingStatus", {
          senderId: socket.userId,
          isTyping,
        });
      }
    });

    // Mark Message Seen
    socket.on("messageSeen", async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { seen: true });

        const senderSocketId = activeUsers.get(senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageSeenUpdate", { messageId });
        }
      } catch (err) {
        console.error("Socket messageSeen error:", err);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${socket.userId})`);
      activeUsers.delete(socket.userId);
      io.emit("getOnlineUsers", Array.from(activeUsers.keys()));
    });
  });
};

module.exports = socketHandler;
