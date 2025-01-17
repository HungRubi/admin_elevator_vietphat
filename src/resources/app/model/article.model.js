const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articles = new Schema(
    {
        subject: {type: String},
        content: {type: String},
        author: {type: String, default: 'Trần Việt'},
        thumbnail: {type: String},
        thumbnail_1: {type: String},
        thumbnail_2: {type: String},
        thumbnail_3: {type: String},
        thumbnail_4: {type: String},
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

module.exports = mongoose.model('articles', articles);