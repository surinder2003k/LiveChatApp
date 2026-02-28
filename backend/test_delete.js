const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB connected");

        const User = require("./models/User");
        const Message = require("./models/Message");
        const FriendRequest = require("./models/FriendRequest");

        const email = "lijaxi1525@creteanu.com";
        const user = await User.findOne({ email });

        if (!user) {
            console.log("Rani not found");
            return;
        }

        const id = user._id;
        console.log("Found Rani ID:", id);

        await User.findByIdAndDelete(id);
        await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] });
        await FriendRequest.deleteMany({ $or: [{ sender: id }, { receiver: id }] });

        console.log("Rani deleted successfully");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
