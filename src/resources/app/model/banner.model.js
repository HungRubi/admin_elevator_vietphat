const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const banner = new Schema(
    {
        name: {type: String},
        thumbnail: {type: String, require},
        thumbnail_1: {type: String},
        content: {type: String},
        status: {
            type: String,
            default: 'public',
            enum: ['public', 'hidden']
        },
        discount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'discount',
            require,
        },
        slug: {type: String}
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('banner', banner);