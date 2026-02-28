const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const User = require("../models/User");

const router = express.Router();

const registerSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"),
  email: z.string().email(),
  password: z.string().min(6).max(72)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72)
});

const oauthSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(32),
  avatar: z.string().url().optional().or(z.literal(""))
});

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await User.findOne({
      $or: [{ username: body.username }, { email: body.email }]
    });
    if (existing) return res.status(409).json({ message: "Username or email already in use" });

    const password = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      username: body.username,
      email: body.email,
      password
    });

    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (e) {
    if (e?.name === "ZodError") return res.status(400).json({ message: e.issues?.[0]?.message || "Invalid input" });
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id.toString());
    res.json({ token, user: user.toSafeJSON() });
  } catch (e) {
    if (e?.name === "ZodError") return res.status(400).json({ message: e.issues?.[0]?.message || "Invalid input" });
    next(e);
  }
});

router.post("/sync", async (req, res, next) => {
  try {
    // For now we trust the payload since it's from the client we control
    // In production, we should verify the Clerk token using @clerk/backend
    const { email, username, avatar } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await User.create({
        username: username || email.split("@")[0],
        email,
        password: randomPassword,
        avatar: avatar || "",
        role: (email === "xyzg135@gmail.com" || email === "xyzg1335@gmail.com") ? "admin" : "user"
      });
    } else {
      // Update info if changed
      let changed = false;
      if (username && username !== user.username) {
        user.username = username;
        changed = true;
      }
      if (avatar && avatar !== user.avatar) {
        user.avatar = avatar;
        changed = true;
      }
      if ((email === "xyzg135@gmail.com" || email === "xyzg1335@gmail.com") && user.role !== "admin") {
        user.role = "admin";
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    const token = signToken(user._id.toString());
    res.json({ token, user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

