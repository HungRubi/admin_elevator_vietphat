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
        birth: Date,
        authour: Boolean,
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('employees', employees);