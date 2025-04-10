const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cart = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Products',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: [1, 'Số lượng phải lớn hơn hoặc bằng 1'],
                    default: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('cart', cart);