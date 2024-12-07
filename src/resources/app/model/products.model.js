const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const products = new Schema(
    {
        name: { type: String, unique: true },
        description: String,
        img: String,
        slug: String,
        price: String,
        type: String,
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('products', products);