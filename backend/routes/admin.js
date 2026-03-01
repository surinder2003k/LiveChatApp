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
            .select("_id username email avatar online lastSeen role status createdAt")
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
        console.log(`[ADMIN] Delete request for user ID: ${id}`);
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            console.log(`[ADMIN] User not found for deletion: ${id}`);
            return res.status(404).json({ message: "User not found" });
        }
        // Cleanup related data
        await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] });
        await FriendRequest.deleteMany({ $or: [{ sender: id }, { receiver: id }] });

        console.log(`[ADMIN] Successfully deleted user: ${user.username}`);
        res.json({ message: "User and all associated data deleted successfully" });
    } catch (e) {
        console.error(`[ADMIN] Delete error for user ${req.params.id}:`, e);
        next(e);
    }
});

// Get all conversations for a user (Admin Chat Viewer)
router.get("/conversations/:userId", auth, isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ message: "userId required" });

        // Get all unique conversation partners
        const sent = await Message.distinct("receiverId", { senderId: userId });
        const received = await Message.distinct("senderId", { receiverId: userId });

        // Merge unique partner IDs
        const allPartnerIds = [...new Set([...sent.map(String), ...received.map(String)])];

        // Get user info for each partner + last message + count
        const conversations = await Promise.all(
            allPartnerIds.map(async (partnerId) => {
                const partner = await User.findById(partnerId).select("_id username avatar online lastSeen");
                if (!partner) return null;
                const count = await Message.countDocuments({
                    $or: [
                        { senderId: userId, receiverId: partnerId },
                        { senderId: partnerId, receiverId: userId }
                    ]
                });
                const lastMsg = await Message.findOne({
                    $or: [
                        { senderId: userId, receiverId: partnerId },
                        { senderId: partnerId, receiverId: userId }
                    ]
                }).sort({ timestamp: -1 });
                return { partner, messageCount: count, lastMessage: lastMsg };
            })
        );

        res.json({
            conversations: conversations.filter(Boolean).sort((a, b) =>
                new Date(b.lastMessage?.timestamp || 0) - new Date(a.lastMessage?.timestamp || 0)
            )
        });
    } catch (e) {
        next(e);
    }
});

// Get full conversation between two users (Admin)
router.get("/conversation", auth, isAdmin, async (req, res, next) => {
    try {
        const { userA, userB } = req.query;
        if (!userA || !userB) return res.status(400).json({ message: "userA and userB required" });

        const messages = await Message.find({
            $or: [
                { senderId: userA, receiverId: userB },
                { senderId: userB, receiverId: userA }
            ]
        })
            .sort({ timestamp: 1 })
            .limit(500);

        res.json({ messages });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
