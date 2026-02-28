const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://livechat:aman2003m@livechatcluster.11tdv3d.mongodb.net/livechat?retryWrites=true&w=majority&appName=livechatCluster";

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db('livechat');

        // Clear all friends and blockedUsers for all users
        const users = db.collection('users');
        const userResult = await users.updateMany(
            {},
            { $set: { friends: [], blockedUsers: [] } }
        );
        console.log(`Cleared social stats for ${userResult.modifiedCount} users`);

        // Delete all friend requests
        const requests = db.collection('friendrequests');
        const requestResult = await requests.deleteMany({});
        console.log(`Deleted ${requestResult.deletedCount} friend requests`);

        console.log("Social reset complete!");
        process.exit(0);
    } catch (err) {
        console.error("Reset failed:", err);
        process.exit(1);
    } finally {
        await client.close();
    }
}

run();
