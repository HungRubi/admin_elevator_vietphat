const { mongoose } = require('mongoose');

module.exports = {
    mutipleMongooseoObject: function (mongooseDocs) {
        if (Array.isArray(mongooseDocs)) {
            return mongooseDocs.map((doc) => doc.toObject());
        }
        return mongooseDocs;
    },

    mongooseToObject: function (mongooseDoc) {
        return mongooseDoc ? mongooseDoc.toObject() : mongooseDoc;
    },
};
