const mongoose = require("mongoose");

const FriendRequestSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined"],
            default: "pending"
        }
    },
    { timestamps: true }
);

// Ensure unique pending requests between two users
FriendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true, partialFilterExpression: { status: "pending" } });

module.exports = mongoose.model("FriendRequest", FriendRequestSchema);
