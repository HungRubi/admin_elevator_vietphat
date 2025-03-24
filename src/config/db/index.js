const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();
async function connect() {
    console.log('Starting MongoDB connection...'); // Log để kiểm tra
    try {
        await mongoose.connect(process.env.DATABASE_URL_CONNECTION);
        console.log('Connect successfully!');
    } catch (error) {
        console.error('Connect failed:', error.message);
    }
}

module.exports = { connect };
