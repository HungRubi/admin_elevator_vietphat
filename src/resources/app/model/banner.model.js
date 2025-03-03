const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const banner = new Schema(
    {
        name: {type: String},
        thumbnail: {type: String, require},
        status: {
            type: String,
            default: 'public',
            enum: ['public', 'hide']
        },
        slug: {type: String}
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('banner', banner);