const mongoose = require('mongoose');

const orders = new mongoose.Schema(
    {
        user_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'users', 
            required: true 
        },
        order_code: { type: String, require: true, unique:true},
        code_banking: {
            type: String, 
        },
        order_date: {type: Date, default: Date.now},
        total_price: {type: Number, min: 0, required: true},
        orderInfor: {
            type: String,
        },
        shipping_address: {
            name: { type: String, required: true }, 
            phone: { type: String, required: true }, 
            address: { type: String, required: true }, 
        },
        payment_method: { 
            type: String,
            enum: ['Thanh toán khi nhận hàng', 'Ví điện tử Momo', 'Atm nội địa'],
            default: 'Thanh toán khi nhận hàng'
        }, 
        status: {
            type: String,
            enum: ['Thành công', 'Đang xử lý', 'Đang giao hàng' ,'Thất bại'], 
            default: 'Đang xử lý',
        },
        discount_id: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'discount',
            default: null,
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('orders', orders);
