const mongoose = require("mongoose");
require("dotenv").config();

async function resetSocial() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGO_URI not found");
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Define schemas to match existing models
        const UserSchema = new mongoose.Schema({
            username: String,
            friends: [mongoose.Schema.Types.ObjectId],
            blockedUsers: [mongoose.Schema.Types.ObjectId]
        });
        const User = mongoose.models.User || mongoose.model("User", UserSchema);

        const FriendRequestSchema = new mongoose.Schema({
            status: String
        });
        const FriendRequest = mongoose.models.FriendRequest || mongoose.model("FriendRequest", FriendRequestSchema);

        // Clear all friends and blockedUsers for all users
        const userResult = await User.updateMany(
            {},
            { $set: { friends: [], blockedUsers: [] } }
        );
        console.log(`Cleared social stats (friends & blocks) for ${userResult.modifiedCount} users`);

        // Delete all friend requests
        const requestResult = await FriendRequest.deleteMany({});
        console.log(`Deleted ${requestResult.deletedCount} friend requests`);

        console.log("Social reset complete! All users are now unfriended and unblocked.");
        process.exit(0);
    } catch (err) {
        console.error("Reset failed:", err);
        process.exit(1);
    }
}

resetSocial();
