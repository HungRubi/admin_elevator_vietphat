const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const video = new Schema(
    {
        name: {type: String, require},
        content: {type: String, require},
        thumbnail: {type: String, require},
        video_url: {type: String, require},
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

module.exports = mongoose.model('video', video);