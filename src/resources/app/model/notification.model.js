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
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'typeRef',
            required: function() { return this.type !== 'Thông báo hệ thống'; }
        },
        typeRef: {
            type: String,
            enum: ['Order', 'User'],
            required: function() { return this.type !== 'Thông báo hệ thống'; }
        },
        recipients: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true
        }],
        isRead: {
            type: Boolean,
            default: false
        },
    }, {
        timestamps: true
    }
);

notification.pre('save', async function(next) {
    if (this.type === 'Thông báo đơn hàng') {
        // Gửi đến người đặt đơn, admin và employee
        const order = await Orders.findById(this.relatedId).populate('user_id');
        const admins = await Users.find({ authour: 'admin' });
        const employees = await Users.find({ authour: 'employee' });
        this.recipients = [order.user_id, ...admins, ...employees].map(user => user._id);
    } else if (this.type === 'Thông báo hệ thống') {
        // Gửi đến tất cả user
        const users = await Users.find();
        this.recipients = users.map(user => user._id);
    } else if (this.type === 'Thông báo khách hàng') {
        // Gửi đến admin và employee
        const admins = await Users.find({ authour: 'admin' });
        const employees = await Users.find({ authour: 'employee' });
        this.recipients = [...admins, ...employees].map(user => user._id);
    }
    next();
});

module.exports =mongoose.model('notification', notification);

