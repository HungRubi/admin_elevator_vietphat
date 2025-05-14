const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const receipt = new Schema(
    {
        code: {
            type: String,
            required: true,
        },
        dateEntry: {
            type: Date,
            required: true,
            default: Date.now,
        },
        supplier: {
            type: Schema.Types.ObjectId,
            ref: 'supplier',
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0,
        },
        status: {
            type: String,
            enum: ['chờ xử lý', 'chưa xác nhận', 'đã xác nhận', 'đã hủy'],
            default: 'chờ xử lý',
        }

    },{
        timestamps: true,
    }
)

module.exports = mongoose.model("receipt", receipt)