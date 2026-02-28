const express = require("express");
const { auth, isAdmin } = require("../middleware/admin");
const User = require("../models/User");
const Message = require("../models/Message");
const FriendRequest = require("../models/FriendRequest");

const router = express.Router();

// Get Admin Stats
router.get("/stats", auth, isAdmin, async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMessages = await Message.countDocuments();
        const totalRequests = await FriendRequest.countDocuments();
        const onlineUsers = await User.countDocuments({ online: true });

        res.json({
            stats: {
                totalUsers,
                totalMessages,
                totalRequests,
                onlineUsers
            }
        });
    } catch (e) {
        next(e);
    }
});

// Get All Users (Detailed for Admin)
router.get("/users", auth, isAdmin, async (req, res, next) => {
    try {
        const users = await User.find({})
            .select("_id username email avatar online role status createdAt")
            .sort({ createdAt: -1 });
        res.json({ users });
    } catch (e) {
        next(e);
    }
});

// Toggle User Role
router.post("/toggle-role", auth, isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.role = user.role === "admin" ? "user" : "admin";
        await user.save();

        res.json({ message: `User role updated to ${user.role}`, user });
    } catch (e) {
        next(e);
    }
});

// Delete User (Nuclear Option)
router.delete("/user/:id", auth, isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        // Cleanup related data
        await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] });
        await FriendRequest.deleteMany({ $or: [{ sender: id }, { receiver: id }] });

        res.json({ message: "User and all associated data deleted successfully" });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
