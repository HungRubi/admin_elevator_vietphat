const mongoose = require('mongoose');

async function connect() {
    console.log('Starting MongoDB connection...'); // Log để kiểm tra
    try {
        await mongoose.connect('mongodb+srv://huyhung18042002:3UGX2QHi7p5sxC5J@elevator.vbn82.mongodb.net/elevator_dev?retryWrites=true&w=majority');
        console.log('Connect successfully!');
    } catch (error) {
        console.error('Connect failed:', error.message);
    }
}

module.exports = { connect };
