const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const custumers = new Schema(
    {
        account: { type: String, unique: true },
        password: String,
        avatar: {
            type: String, 
            default:'https://www.dropbox.com/scl/fi/896n7adhufqiu2hlt94u5/default.png?rlkey=gk9thmq6u1grzss8o0c3os39f&st=83b9myer&dl=1'
        },
        name : String,
        address: String,
        phone: String,
        isVerified: { type: Boolean, default: false },
        lastLogin: {type: Date, default: Date.now},
        birth: {type: Date, default: Date.now},
        status: {
            type: String,
            enum: ['verified', 'unverified', 'banned'],
            default: 'verified', 
            required: true, 
            index: true, 
        },
        email: String,
        isCustumer: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('custumers', custumers);