const express = require("express");
const { z } = require("zod");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

const { auth } = require("../middleware/auth");
const Message = require("../models/Message");
const User = require("../models/User");

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "livechat_uploads",
    allowed_formats: ["jpg", "png", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }] // Optimization
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post("/upload", auth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ url: req.file.path, success: true });
});

const sendSchema = z.object({
  text: z.string().max(2000).optional(),
  image: z.string().optional()
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
    const meId = req.user.id;
    const otherId = req.params.userId;
    if (!mongoose.isValidObjectId(otherId)) return res.status(400).json({ message: "Invalid user id" });

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
      image: body.image || null,
      type: body.image ? "image" : "text",
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
