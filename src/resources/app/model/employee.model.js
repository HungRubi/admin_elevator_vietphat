const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employees = new Schema(
    {
        account: { type: String, unique: true },
        password: String,
        isVerified: { type: Boolean, default: false },
        googleId: { type: String, unique: true },
        avatar: String,
        name : String,
        address: String,
        phone: String,
        email: String,
        isWorking: {type: Boolean, default: true},
        birth: Date,
        authour: Boolean,
        lastLogin: {type: Date, default: Date.now},
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('employees', employees);