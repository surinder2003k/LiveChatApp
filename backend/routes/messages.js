const express = require("express");
const { z } = require("zod");
const mongoose = require("mongoose");

const { auth } = require("../middleware/auth");
const Message = require("../models/Message");

const router = express.Router();

const sendSchema = z.object({
  text: z.string().min(1).max(2000)
});

router.get("/:userId", auth, async (req, res, next) => {
  try {
    const meId = req.user.id;
    const otherId = req.params.userId;
    if (!mongoose.isValidObjectId(otherId)) return res.status(400).json({ message: "Invalid user id" });

    const messages = await Message.find({
      $or: [
        { senderId: meId, receiverId: otherId },
        { senderId: otherId, receiverId: meId }
      ]
    })
      .sort({ timestamp: 1 })
      .limit(2000)
      .lean();

    res.json({ messages });
  } catch (e) {
    next(e);
  }
});

router.post("/:userId", auth, async (req, res, next) => {
  try {
    const me = await User.findById(meId);
    const other = await User.findById(otherId);
    if (!other) return res.status(404).json({ message: "User not found" });

    const isBlockedByMe = me.blockedUsers.includes(otherId);
    const hasBlockedMe = other.blockedUsers.includes(meId);

    if (isBlockedByMe || hasBlockedMe) {
      return res.status(403).json({ message: "Communication restricted" });
    }

    const body = sendSchema.parse(req.body);
    const message = await Message.create({
      senderId: meId,
      receiverId: otherId,
      text: body.text,
      timestamp: new Date(),
      seen: false
    });

    res.status(201).json({ message });
  } catch (e) {
    if (e?.name === "ZodError") return res.status(400).json({ message: e.issues?.[0]?.message || "Invalid input" });
    next(e);
  }
});

router.post("/:userId/seen", auth, async (req, res, next) => {
  try {
    const meId = req.user.id;
    const otherId = req.params.userId;
    if (!mongoose.isValidObjectId(otherId)) return res.status(400).json({ message: "Invalid user id" });

    await Message.updateMany(
      { senderId: otherId, receiverId: meId, seen: false },
      { $set: { seen: true } }
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Delete ALL messages (global reset)
router.delete("/all", auth, async (req, res, next) => {
  try {
    await Message.deleteMany({});
    res.json({ message: "All messages deleted" });
  } catch (e) {
    next(e);
  }
});

// Delete messages for a specific chat
router.delete("/:userId/clear", auth, async (req, res, next) => {
  try {
    const meId = req.user.id;
    const otherId = req.params.userId;
    if (!mongoose.isValidObjectId(otherId)) return res.status(400).json({ message: "Invalid user id" });

    await Message.deleteMany({
      $or: [
        { senderId: meId, receiverId: otherId },
        { senderId: otherId, receiverId: meId }
      ]
    });

    // Notify the other user via socket if they are online
    const io = req.app.get("io");
    if (io) {
      io.to(String(otherId)).emit("chatCleared", { from: meId });
    }

    res.json({ message: "Chat cleared for both users" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

