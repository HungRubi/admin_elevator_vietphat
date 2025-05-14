const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const receiptDetail = new Schema(
    {
        receipt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'receipt',
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true,
        },
        price: {
            type: Number,
            require: true,
        },
        quantity: {
            type: Number,
            require: true,
            default: 1,
        },
    },{
        timestamps: true,
    }
)

module.exports = mongoose.model("receiptDetail", receiptDetail)