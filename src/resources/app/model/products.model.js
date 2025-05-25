const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const products = new Schema(
    {
        name: { type: String, required: true, index: true }, 
        slug: { type: String, unique: true }, 
        price: { type: Number, index: true },
        cog: { type: Number, default: 0 }, 
        description: { type: String },
        thumbnail_main: { type: String, required: true },
        thumbnail_1: { type: String, required: true },
        thumbnail_2: { type: String, required: true },
        thumbnail_3: { type: String, required: true },
        unit: { type: String, required: true },
        sale: {type: Number, default: 0},
        shipping_cost: { type: Number, default: 0 },
        minimum: {type: Number, index: true, default: 10},
        warranty_period: {
            type: Number,
            required: true,
            default: 1
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'supplier', 
            required: true
        },
        category: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'categoryProduct', 
            require:true
        },
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('products', products);