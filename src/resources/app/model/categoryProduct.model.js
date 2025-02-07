const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categoryProduct = new Schema(
    {
        name: { type: String, required: true}, 
        slug: { type: String, unique: true }, 
        description: { type: String },
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('categoryProduct', categoryProduct);