const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const custumers = new Schema(
    {
        account: { type: String, unique: true },
        password: String,
        img: String,
        name : String,
        address: String,
        phone: String,
        email: String,
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('custumers', custumers);