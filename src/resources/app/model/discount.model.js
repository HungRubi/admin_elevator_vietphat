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
        end_date: {
            type: Date,
            default: function() { 
                return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            }
        },
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

discount.virtual('current_status').get(function() {
    return (new Date() > this.end_date) ? 'stop' : this.is_active;
});

// Cập nhật trạng thái khi save document
discount.pre('save', function(next) {
    if (this.end_date < new Date() && this.is_active === 'active') {
        this.is_active = 'stop';
    }
    next();
});

// Cập nhật trạng thái khi dùng findOneAndUpdate, findByIdAndUpdate,...
discount.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update && update.end_date) {
        if (new Date(update.end_date) < new Date()) {
            update.is_active = 'stop';
        }
    }
    next();
});

// Các middleware 'find' và 'findOne' vẫn giữ để cập nhật hàng loạt khi query
discount.pre('find', async function() {
    await mongoose.model('discount').updateMany(
        { 
            end_date: { $lt: new Date() },
            is_active: 'active'
        },
        { 
            is_active: 'stop' 
        }
    );
});

discount.pre('findOne', async function() {
    await mongoose.model('discount').updateMany(
        { 
            end_date: { $lt: new Date() },
            is_active: 'active'
        },
        { 
            is_active: 'stop' 
        }
    );
});

discount.statics.updateAllStatus = async function() {
    const now = new Date();
    return this.updateMany(
        { end_date: { $lt: now }, is_active: 'active' },
        { is_active: 'stop' }
    );
};


module.exports = mongoose.model('discount', discount);
