const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employees = new Schema(
    {
        account: { type: String, unique: true },
        password: String,
        img: String,
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