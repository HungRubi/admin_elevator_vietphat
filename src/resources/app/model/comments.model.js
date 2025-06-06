const mongoose = require('mongoose');

const comments = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            require: true,
        },
        product_id: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                require: true,
            }
        ],
        star: {
            type: Number,
            require: true,
            min: 1,
            max: 5,
        },
        quality: {
            type: String,
            require: true,
        },
        isAccurate: {
            type: String,
            require: true
        },
        message: {
            type: String,
        },
        img: {
            type: String,
        },
        img_1: {
            type: String,
        },
        img_2: {
            type: String,
        },
        video: {
            type: String,
        },
    },{
        timestamps: true,
    }
)

module.exports = mongoose.model('comments', comments);