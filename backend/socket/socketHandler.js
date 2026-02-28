const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Message = require("../models/Message");

function roomIdFor(a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return `dm:${x}:${y}`;
}

function initSocket(server, { corsOrigins }) {
  const io = new Server(server, {
    cors: {
      origin: Array.isArray(corsOrigins) && corsOrigins.length ? corsOrigins : true,
      credentials: true
    }
  });

  const onlineUserIds = new Set(); // userId strings
  const socketToUser = new Map(); // socket.id -> userId
  const userToSockets = new Map(); // userId -> Set(socketId)

  function emitOnlineUsers() {
    io.emit("onlineUsers", Array.from(onlineUserIds));
  }

  async function setUserOnline(userId, online) {
    await User.findByIdAndUpdate(userId, { $set: { online } }).catch(() => { });
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.sub;
      return next();
    } catch (_e) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    socketToUser.set(socket.id, userId);
    onlineUserIds.add(userId);
    if (!userToSockets.has(userId)) userToSockets.set(userId, new Set());
    userToSockets.get(userId).add(socket.id);

    // Join personal room for notifications
    socket.join(String(userId));

    await setUserOnline(userId, true);
    emitOnlineUsers();

    socket.on("joinChat", async ({ otherUserId }) => {
      if (!mongoose.isValidObjectId(otherUserId)) return;
      const room = roomIdFor(userId, otherUserId);
      socket.join(room);
      socket.emit("joinedChat", { room });
    });

    socket.on("typing", ({ otherUserId }) => {
      if (!mongoose.isValidObjectId(otherUserId)) return;
      const room = roomIdFor(userId, otherUserId);
      socket.to(room).emit("typing", { from: userId });
    });

    socket.on("stopTyping", ({ otherUserId }) => {
      if (!mongoose.isValidObjectId(otherUserId)) return;
      const room = roomIdFor(userId, otherUserId);
      socket.to(room).emit("stopTyping", { from: userId });
    });

    socket.on("sendMessage", async ({ to, text, tempId }) => {
      try {
        if (!mongoose.isValidObjectId(to)) return;
        if (typeof text !== "string" || !text.trim()) return;

        const trimmed = text.trim().slice(0, 2000);
        const msg = await Message.create({
          senderId: userId,
          receiverId: to,
          text: trimmed,
          timestamp: new Date(),
          seen: false
        });

        const payload = { message: msg.toObject(), tempId: tempId || null };
        const room = roomIdFor(userId, to);
        io.to(room).emit("message", payload);

        // Also notify the receiver if they aren't in the room
        userToSockets.get(to)?.forEach((sid) => {
          io.to(sid).emit("messageNotification", payload);
        });
      } catch (_e) {
        socket.emit("errorMessage", { message: "Failed to send message" });
      }
    });

    socket.on("editMessage", async ({ messageId, newText }) => {
      try {
        if (!mongoose.isValidObjectId(messageId)) return;
        if (!newText || !newText.trim()) return;

        const msg = await Message.findOneAndUpdate(
          { _id: messageId, senderId: userId },
          { $set: { text: newText.trim(), isEdited: true } },
          { new: true }
        );

        if (msg) {
          const room = roomIdFor(msg.senderId, msg.receiverId);
          io.to(room).emit("messageUpdate", { message: msg });
        }
      } catch (_e) {
        socket.emit("errorMessage", { message: "Failed to edit message" });
      }
    });

    socket.on("unsendMessage", async ({ messageId }) => {
      try {
        if (!mongoose.isValidObjectId(messageId)) return;
        const msg = await Message.findOne({ _id: messageId, senderId: userId });
        if (msg) {
          await Message.deleteOne({ _id: messageId });
          const room = roomIdFor(msg.senderId, msg.receiverId);
          io.to(room).emit("messageDelete", { messageId });
        }
      } catch (_e) {
        socket.emit("errorMessage", { message: "Failed to unsend message" });
      }
    });

    socket.on("reactToMessage", async ({ messageId, emoji }) => {
      try {
        if (!mongoose.isValidObjectId(messageId)) return;

        const msg = await Message.findById(messageId);
        if (!msg) return;

        const existingIdx = msg.reactions.findIndex(r => String(r.userId) === String(userId));

        if (existingIdx > -1) {
          if (msg.reactions[existingIdx].emoji === emoji) {
            // Remove if same
            msg.reactions.splice(existingIdx, 1);
          } else {
            // Update if different
            msg.reactions[existingIdx].emoji = emoji;
          }
        } else {
          msg.reactions.push({ userId, emoji });
        }

        await msg.save();
        const room = roomIdFor(msg.senderId, msg.receiverId);
        io.to(room).emit("messageUpdate", { message: msg });
      } catch (_e) {
        socket.emit("errorMessage", { message: "Failed to react" });
      }
    });

    socket.on("markSeen", async ({ otherUserId }) => {
      try {
        if (!mongoose.isValidObjectId(otherUserId)) return;
        const updated = await Message.updateMany(
          { senderId: otherUserId, receiverId: userId, seen: false },
          { $set: { seen: true } }
        );
        if (updated.modifiedCount > 0) {
          const room = roomIdFor(userId, otherUserId);
          io.to(room).emit("seenUpdate", { by: userId, otherUserId });
        }
      } catch (_e) { }
    });

    socket.on("disconnect", async () => {
      socketToUser.delete(socket.id);
      const set = userToSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userToSockets.delete(userId);
      }

      const stillOnline = userToSockets.has(userId);
      if (!stillOnline) {
        onlineUserIds.delete(userId);
        await setUserOnline(userId, false);
        emitOnlineUsers();
      }
    });
  });

  return io;
}

module.exports = { initSocket };

