const mongoose = require('mongoose');

const orders = new mongoose.Schema(
    {
        orderId: { type: String, required: true, unique: true }, 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'custumers', required: true }, 
        items: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true }, 
                quantity: { type: Number, required: true, min: 1 }, 
                price: { type: Number, required: true }, 
            },
        ],
        totalPrice: { type: Number, required: true }, 
        status: {
            type: String,
            enum: ['Hoàn thành', 'Đang xử lý', 'Đang vận chuyển', 'Đang giao hàng', 'Hoàn thành', 'Hủy', 'Trả hàng'], // Trạng thái đơn hàng
            default: 'Hoàn thành',
        },
        shippingAddress: {
            name: { type: String, required: true }, 
            phone: { type: String, required: true }, 
            address: { type: String, required: true }, 
        },
        paymentMethod: { 
            type: String,
            enum: ['Thanh toán khi nhận hàng', 'Visa', 'Atm nội địa'],
            default: 'Thanh toán khi nhận hàng'
        }, 
        paymentStatus: {
            type: String,
            enum: ['Thành công', 'Đang xử lý', 'Thất bại'], 
            default: 'Thành công',
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('orders', orders);
