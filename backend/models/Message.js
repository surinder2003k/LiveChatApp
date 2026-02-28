const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: false, trim: true },
    image: { type: String },
    type: { type: String, enum: ["text", "image"], default: "text" },
    timestamp: { type: Date, default: Date.now, index: true },
    seen: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    reactions: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String }
    }]
  },
  { timestamps: true }
);

MessageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });

module.exports = mongoose.model("Message", MessageSchema);

