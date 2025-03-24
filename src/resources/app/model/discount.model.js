const mongoose = require('mongoose');

const discount = new mongoose.Schema(
    {
        title: {type: String, require: true},
        description: {type: String, require: true},
        discount_type: {
            type: String, 
            enum: [
                'giảm theo phần trăm',
                'giảm theo số tiền cố định',
            ],
            require: true,
        },
        value_discount: {type: Number, min: 1, require: true},
        start_date: {type: Date, default: Date.now},
        end_date: {type: Date, default: () => new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
        )},
        is_active: {
            type: String, 
            enum: ['active', 'stop'],
            default: 'active'
        },
        minimum_purchase: {type: Number, require: true},
        use_limit: {type: Number, min: 1, require: true},//tổng số lần sử dụng tối đa mã giảm giá với tất cả user trong hệ thống
        use_count: {type: Number, min: 0, default: 0},//tổng số lần đã sử dụng mã giảm giá với tất cả user trong hệ thống
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('discount', discount);
