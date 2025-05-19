const mongoose = require('mongoose');
const Orders = require('../model/orders.model');
const Users = require('../model/user.model')
const notification = new mongoose.Schema(
    {
        type: {
            type: String,
            default: 'Thông báo hệ thống',
            enum: [
                'Thông báo hệ thống',
                'Thông báo đơn hàng',
                'Thông báo khách hàng'
            ]
        },
        message: {
            type: String,
            required: true
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
    }, {
        timestamps: true
    }
);



module.exports =mongoose.model('notification', notification);

