const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const custumers = new Schema(
    {
        account: { type: String, unique: true },
        password: String,
        avatar: String,
        name : String,
        address: String,
        phone: String,
        isVerified: { type: Boolean, default: false },
        lastLogin: {type: Date, default: Date.now},
        birth: {type: Date, default: Date.now},
        status: {type: Number, default: 1},
        email: String,
        isCustumer: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('custumers', custumers);