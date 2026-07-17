const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  sendMessage,
  getChatHistory,
  getConversations,
  getUnreadCount,
} = require("../controllers/chat.controller");

router.post("/send", protect, sendMessage);
router.get("/history/:otherUserId", protect, getChatHistory);
router.get("/conversations", protect, getConversations);
router.get("/unread-count", protect, getUnreadCount);

module.exports = router;
