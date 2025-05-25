const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const warranty = new Schema(
    {
        code: {
            type: String,
            required: true
        },
        order_code: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'orders',
            required: true
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        address: {
            type: String,
            required: true
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        purchase_date: {
            type: Date,
            required: true,
        },
        warranty_date: {
            type: Date,
            required: true,
        },
        description: {
            type: String,
            required: true
        },
        video: {
            type: String,
        },
        status: {
            type: String,
            enum: ["đang xử lý", "chấp thuận","bị hủy"]
        }
    },{
        timestamps: true
    }
)

module.exports = mongoose.model("warranty", warranty);