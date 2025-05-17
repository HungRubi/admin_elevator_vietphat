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
            enum: ['chưa xác nhận', 'đã xác nhận', 'đã hủy'],
            default: 'chưa xác nhận',
        }

    },{
        timestamps: true,
    }
)

module.exports = mongoose.model("receipt", receipt)