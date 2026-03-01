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
        const mongoose = require("mongoose");

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid or missing userId" });
        }

        const userObjId = new mongoose.Types.ObjectId(userId);

        // Get all unique conversation partners
        const sent = await Message.distinct("receiverId", { senderId: userObjId });
        const received = await Message.distinct("senderId", { receiverId: userObjId });

        // Merge unique partner IDs, filter out any invalid/nulls
        const allPartnerIds = [...new Set([...sent, ...received])]
            .filter(id => id && mongoose.Types.ObjectId.isValid(String(id)));

        // Get user info for each partner + last message + count
        const conversations = await Promise.all(
            allPartnerIds.map(async (partnerId) => {
                try {
                    const pId = new mongoose.Types.ObjectId(String(partnerId));
                    const partner = await User.findById(pId).select("_id username avatar online lastSeen");
                    if (!partner) return null;

                    const count = await Message.countDocuments({
                        $or: [
                            { senderId: userObjId, receiverId: pId },
                            { senderId: pId, receiverId: userObjId }
                        ]
                    });

                    const lastMsg = await Message.findOne({
                        $or: [
                            { senderId: userObjId, receiverId: pId },
                            { senderId: pId, receiverId: userObjId }
                        ]
                    }).sort({ timestamp: -1 }).lean();

                    return { partner, messageCount: count, lastMessage: lastMsg };
                } catch (err) {
                    console.error(`[ADMIN ERROR] Partner ${partnerId}:`, err);
                    return null;
                }
            })
        );

        const filtered = conversations.filter(Boolean);

        // Sort by last message timestamp
        filtered.sort((a, b) => {
            const dateA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
            const dateB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
            return dateB - dateA;
        });

        res.json({ conversations: filtered });
    } catch (e) {
        console.error(`[ADMIN CRITICAL ERROR]:`, e);
        res.status(500).json({ message: e.message || "Failed to fetch conversations" });
    }
});

// Get full conversation between two users (Admin)
router.get("/conversation", auth, isAdmin, async (req, res, next) => {
    try {
        const { userA, userB } = req.query;
        const mongoose = require("mongoose");

        if (!userA || !userB || !mongoose.Types.ObjectId.isValid(userA) || !mongoose.Types.ObjectId.isValid(userB)) {
            return res.status(400).json({ message: "Valid userA and userB required" });
        }

        const messages = await Message.find({
            $or: [
                { senderId: userA, receiverId: userB },
                { senderId: userB, receiverId: userA }
            ]
        })
            .sort({ timestamp: 1 })
            .limit(1000)
            .lean();

        res.json({ messages });
    } catch (e) {
        console.error(`[ADMIN ERROR] /conversation:`, e);
        res.status(500).json({ message: e.message || "Server error" });
    }
});

module.exports = router;
