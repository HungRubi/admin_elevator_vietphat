const mongoose = require('mongoose');

const orderDetail = new mongoose.Schema(
    {
        order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'orders', required: true }, 
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
        total_price: {type: Number, min: 0, require: true},
        shipping_address: {
            name: { type: String, required: true }, 
            phone: { type: String, required: true }, 
            address: { type: String, required: true }, 
        },
        payment_method: { 
            type: String,
            enum: ['Thanh toán khi nhận hàng', 'Visa', 'Atm nội địa'],
            default: 'Thanh toán khi nhận hàng'
        }, 
        status: {
            type: String,
            enum: ['Thành công', 'Đang xử lý', 'Thất bại'], 
            default: 'Thành công',
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('orderDetail', orderDetail);
