const mongoose = require('mongoose');

async function connect() {
    console.log('Starting MongoDB connection...'); // Log để kiểm tra
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/elevator_dev');
        console.log('Connect successfully!');
    } catch (error) {
        console.error('Connect failed:', error.message);
    }
}

module.exports = { connect };
