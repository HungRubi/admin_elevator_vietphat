const mongoose = require('mongoose');

const orderDetail = new mongoose.Schema(
    {
        order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'orders', required: true }, 
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
        quantity: {type: Number, min: 1, default: 1},
        price: {type: Number, min: 0, require: true},
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('orderDetail', orderDetail);
