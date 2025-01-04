const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cart = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product', // Liên kết tới model Product
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
        status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled'],
            default: 'pending',
        },
    },
    {
        timestamps: true
    }
);

cart.pre('save', function(next) {
    this.totalPrice = this.items.reduce((total, item) => {
        return total + item.quantity * item.price;
    }, 0);
    next();
})

module.exports = mongoose.model('cart', cart);