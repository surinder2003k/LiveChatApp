const express = require("express");
const { auth } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

const FriendRequest = require("../models/FriendRequest");

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
});

// Update status
router.patch("/status", auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { status }, { new: true });
    res.json({ user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
});

// Friend Request Routes
router.post("/friend-request", auth, async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;
    if (senderId === receiverId) return res.status(400).json({ message: "Cannot friend yourself" });

    const existing = await FriendRequest.findOne({ sender: senderId, receiver: receiverId, status: "pending" });
    if (existing) return res.status(400).json({ message: "Request already pending" });

    const request = new FriendRequest({ sender: senderId, receiver: receiverId });
    await request.save();
    res.json({ message: "Request sent" });
  } catch (e) {
    next(e);
  }
});

router.post("/unblock", auth, async (req, res, next) => {
  try {
    const { userId } = req.body;
    await User.findByIdAndUpdate(req.user.id, { $pull: { blockedUsers: userId } });
    res.json({ message: "User unblocked" });
  } catch (e) {
    next(e);
  }
});

router.post("/friend-accept", auth, async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = await FriendRequest.findById(requestId);
    if (!request || String(request.receiver) !== String(req.user.id)) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
    await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

    res.json({ message: "Request accepted" });
  } catch (e) {
    next(e);
  }
});

router.post("/block", auth, async (req, res, next) => {
  try {
    const { userId } = req.body;
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { blockedUsers: userId } });
    res.json({ message: "User blocked" });
  } catch (e) {
    next(e);
  }
});

router.get("/", auth, async (req, res, next) => {
  try {
    const meId = req.user.id;
    const me = await User.findById(meId);
    if (!me) return res.status(404).json({ message: "User not found" });

    // Get ALL active users (we filter/mask blocked ones in the loop)
    const users = await User.find({})
      .select("_id username email avatar online status friends blockedUsers")
      .sort({ online: -1, username: 1 })
      .lean();

    const Message = require("../models/Message");
    const usersWithMeta = await Promise.all(
      users.map(async (user) => {
        const isMe = String(user._id) === String(meId);
        if (isMe) {
          return { ...user, isMe: true, friendshipStatus: "me" };
        }

        const isBlockedByMe = me.blockedUsers.some(bId => String(bId) === String(user._id));
        const hasBlockedMe = user.blockedUsers?.some(bId => String(bId) === String(meId)) || false;

        // Hide online status if blocked either way
        const effectiveOnline = (isBlockedByMe || hasBlockedMe) ? false : user.online;
        const effectiveStatus = (isBlockedByMe || hasBlockedMe) ? "Blocked" : user.status;

        const isFriend = me.friends.some(fId => String(fId) === String(user._id));

        let friendshipStatus = "none";
        let requestId = null;
        if (isFriend) {
          friendshipStatus = "accepted";
        } else {
          const sent = await FriendRequest.findOne({ sender: meId, receiver: user._id, status: "pending" });
          const received = await FriendRequest.findOne({ sender: user._id, receiver: meId, status: "pending" });
          if (sent) {
            friendshipStatus = "sent";
            requestId = sent._id;
          } else if (received) {
            friendshipStatus = "received";
            requestId = received._id;
          }
        }

        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: meId,
          seen: false
        });

        return {
          ...user,
          online: effectiveOnline,
          status: effectiveStatus,
          isBlockedByMe,
          hasBlockedMe,
          unreadCount,
          friendshipStatus,
          requestId
        };
      })
    );
    res.json({ users: usersWithMeta.filter(Boolean) });
  } catch (e) {
    next(e);
  }
});

// Update friend-request to emit
router.post("/friend-request", auth, async (req, res, next) => {
  try {
    const receiverId = req.body.receiverId;
    const senderId = req.user.id;
    if (senderId === receiverId) return res.status(400).json({ message: "Cannot friend yourself" });

    // Check for blocks
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    const isBlockedByMe = sender.blockedUsers.some(id => String(id) === String(receiverId));
    const hasBlockedMe = receiver.blockedUsers.some(id => String(id) === String(senderId));

    if (isBlockedByMe || hasBlockedMe) {
      return res.status(403).json({ message: "Cannot send request to/from a blocked user" });
    }

    const existing = await FriendRequest.findOne({ sender: senderId, receiver: receiverId, status: "pending" });
    if (existing) return res.status(400).json({ message: "Request already pending" });

    const request = new FriendRequest({ sender: senderId, receiver: receiverId });
    await request.save();

    const io = req.app.get("io");
    if (io) {
      io.to(String(receiverId)).emit("friendRequest", { from: senderId });
    }

    res.json({ message: "Request sent" });
  } catch (e) {
    next(e);
  }
});

// Update friend-accept to emit
router.post("/friend-accept", auth, async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = await FriendRequest.findById(requestId);
    if (!request || String(request.receiver) !== String(req.user.id)) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
    await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

    const io = req.app.get("io");
    if (io) {
      io.to(String(request.sender)).emit("friendAccept", { from: req.user.id });
    }

    res.json({ message: "Request accepted" });
  } catch (e) {
    next(e);
  }
});

// Cancel a sent request
router.post("/friend-cancel", auth, async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = await FriendRequest.findOne({ _id: requestId, sender: req.user.id, status: "pending" });
    if (!request) return res.status(404).json({ message: "Request not found" });

    await FriendRequest.deleteOne({ _id: requestId });

    const io = req.app.get("io");
    if (io) {
      io.to(String(request.receiver)).emit("friendCancel", { from: req.user.id });
    }

    res.json({ message: "Request cancelled" });
  } catch (e) {
    next(e);
  }
});

// Decline a received request
router.post("/friend-decline", auth, async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = await FriendRequest.findOne({ _id: requestId, receiver: req.user.id, status: "pending" });
    if (!request) return res.status(404).json({ message: "Request not found" });

    await FriendRequest.deleteOne({ _id: requestId });

    const io = req.app.get("io");
    if (io) {
      io.to(String(request.sender)).emit("friendDecline", { from: req.user.id });
    }

    res.json({ message: "Request declined" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

