const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const supplier = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        }
    },{
        timestamps: true
    }
);

module.exports = mongoose.model("supplier", supplier)