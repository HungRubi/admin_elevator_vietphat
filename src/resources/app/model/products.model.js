const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const products = new Schema(
    {
        name: { type: String, required: true }, 
        slug: { type: String, unique: true }, 
        price: { type: Number, index: true }, 
        description: { type: String },
        stock: { type: Number, index: true },
        unit: String,
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('products', products);