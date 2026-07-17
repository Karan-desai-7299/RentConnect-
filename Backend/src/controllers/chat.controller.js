const Message = require("../models/message.model");
const User = require("../models/user.model");
const { success, error } = require("../utils/apiResponse");

// @desc    Get message history between logged in user and another user
// @route   GET /api/v1/chat/history/:otherUserId
// @access  Private
// Added pagination support with ?before=messageId&limit=50
const getChatHistory = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.user._id;
    const { before, limit = 50 } = req.query;

    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    
    // Build query
    const query = {
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    };

    // If before messageId is provided, fetch messages older than that message's createdAt
    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    // Retrieve messages (sorted newest-first for cursor pagination)
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    // Reverse to return in chronological order (oldest first for client UI)
    messages.reverse();

    // Mark any incoming messages as seen
    await Message.updateMany(
      { sender: otherUserId, receiver: currentUserId, seen: false },
      { $set: { seen: true } }
    );

    return success(res, messages);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Get active conversation summaries (contacts list)
// @route   GET /api/v1/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Aggregation pipeline: deduplicate conversation partners in DB, not Node memory.
    // Previously this loaded EVERY message into memory and looped in JS.
    const conversations = await Message.aggregate([
      // Step 1: Only messages involving the current user
      {
        $match: {
          $or: [{ sender: currentUserId }, { receiver: currentUserId }],
        },
      },
      // Step 2: Compute a conversation key from sorted participant IDs so both
      // directions (A→B and B→A) map to the same key. Also derive the otherId.
      {
        $addFields: {
          conversationKey: {
            $cond: {
              if: { $lte: ["$sender", "$receiver"] },
              then: { $concat: [{ $toString: "$sender" }, "|", { $toString: "$receiver" }] },
              else: { $concat: [{ $toString: "$receiver" }, "|", { $toString: "$sender" }] },
            },
          },
          otherId: {
            $cond: {
              if: { $eq: ["$sender", currentUserId] },
              then: "$receiver",
              else: "$sender",
            },
          },
        },
      },
      // Step 3: Sort newest first so $group keeps the latest message per group
      { $sort: { createdAt: -1 } },
      // Step 4: Group by conversation key — first doc per group is the latest message
      {
        $group: {
          _id: "$conversationKey",
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          otherId: { $first: "$otherId" },
        },
      },
      // Step 5: Sort conversations by most recent activity
      { $sort: { lastMessageTime: -1 } },
    ]);

    if (conversations.length === 0) {
      return success(res, []);
    }

    // Fetch all contact details in a single query
    const otherIds = conversations.map((c) => c.otherId);
    const contacts = await User.find({ _id: { $in: otherIds } }).select(
      "name email phone role profileImage"
    );
    const contactMap = new Map(contacts.map((c) => [c._id.toString(), c]));

    // Count unread messages per conversation in a single batch query (no N+1)
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          sender: { $in: otherIds },
          receiver: currentUserId,
          seen: false,
        },
      },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map(unreadCounts.map((u) => [u._id.toString(), u.count]));

    const summaries = conversations
      .map((conv) => {
        const contact = contactMap.get(conv.otherId.toString());
        if (!contact) return null;
        return {
          contact,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: unreadMap.get(conv.otherId.toString()) || 0,
        };
      })
      .filter(Boolean);

    return success(res, summaries);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// @desc    Get total unread messages count across all conversations
// @route   GET /api/v1/chat/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const total = await Message.countDocuments({
      receiver: currentUserId,
      seen: false,
    });
    return success(res, { total });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  getChatHistory,
  getConversations,
  getUnreadCount,
};
