const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  getChatHistory,
  getConversations,
  getUnreadCount,
} = require("../controllers/chat.controller");

router.get("/history/:otherUserId", protect, getChatHistory);
router.get("/conversations", protect, getConversations);
router.get("/unread-count", protect, getUnreadCount);

module.exports = router;
