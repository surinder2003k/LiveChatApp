const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkNames() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'username email');
    console.log('Current Users in DB:', JSON.stringify(users, null, 2));
    process.exit(0);
}

checkNames();
