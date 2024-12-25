const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orders = new Schema(
    {
        time: Date,
        total_price: String,
        description: String,
        products: String,
        img: String,
        slug: String,
        type: String,
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('orders', orders);