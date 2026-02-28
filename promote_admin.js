const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://livechat:aman2003m@livechatcluster.11tdv3d.mongodb.net/livechat?retryWrites=true&w=majority&appName=livechatCluster";

async function promote() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        const emails = ["xyzg135@gmail.com", "xyzg1335@gmail.com"];

        const UserSchema = new mongoose.Schema({
            email: String,
            role: String
        }, { strict: false });
        const User = mongoose.models.User || mongoose.model("User", UserSchema);

        for (const email of emails) {
            const result = await User.findOneAndUpdate(
                { email: email },
                { $set: { role: "admin" } },
                { new: true }
            );
            if (result) {
                console.log(`SUCCESS: ${email} is now an ADMIN. (Current Role: ${result.role})`);
            } else {
                console.log(`NOT FOUND: User with email ${email} not found in DB.`);
            }
        }
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        console.log("Done.");
        process.exit(0);
    }
}

promote();
