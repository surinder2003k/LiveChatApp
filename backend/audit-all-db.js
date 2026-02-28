const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAllNames() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log('FULL USER LIST IN DB:');
    users.forEach(u => {
        console.log(`- Email: ${u.email}, Username: ${u.username}, Status: ${u.status}`);
    });
    process.exit(0);
}

checkAllNames();
