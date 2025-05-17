const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WarehouseSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'products',
            required: true,
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
        },
        minimum: {
            type: Number,
            required: true,
            default: 0,
        },
        maximum: {
            type: Number,
            required: true,
            default: 0,
        },
        location: {
            type: String,
        },
        status: {
            type: String,
            enum: ['sắp hết hàng', 'còn hàng', 'hết hàng'],
            default: 'còn hàng',
        },
    },{
        timestamps: true,
    }
);

// Middleware để tự động cập nhật status sau khi lấy document
WarehouseSchema.post('find', function(docs) {
    if (!Array.isArray(docs)) return docs;
    
    docs.forEach(doc => {
        updateDocumentStatus(doc);
    });
    
    return docs;
});

WarehouseSchema.post('findOne', function(doc) {
    if (!doc) return doc;
    
    updateDocumentStatus(doc);
    
    return doc;
});

// Middleware để cập nhật status trước khi lưu
WarehouseSchema.pre('save', function(next) {
    updateDocumentStatus(this);
    next();
});

// Hàm cập nhật trạng thái áp dụng logic chính xác
function updateDocumentStatus(doc) {
    // Trường hợp 1: Nếu stock = 0 hoặc stock < minimum
    if (doc.stock === 0 || doc.stock < doc.minimum) {
        doc.status = 'hết hàng';
    }
    // Trường hợp 2: Nếu stock > minimum nhưng chỉ lớn hơn 1-5 đơn vị
    else if (doc.stock > doc.minimum && doc.stock <= doc.minimum + 5) {
        doc.status = 'sắp hết hàng';
    }
    // Trường hợp 3: Nếu stock > minimum + 5
    else if (doc.stock > doc.minimum + 5) {
        doc.status = 'còn hàng';
    }
    // Trường hợp 4: Nếu stock = minimum (không thuộc các trường hợp trên)
    else if (doc.stock === doc.minimum) {
        doc.status = 'sắp hết hàng'; // hoặc 'hết hàng' tùy theo yêu cầu của bạn
    }
}

// Phương thức static để cập nhật status cho tất cả document
WarehouseSchema.statics.updateAllStatus = async function() {
    const Warehouse = this;
    
    // Cập nhật "hết hàng" cho stock = 0 hoặc stock < minimum
    await Warehouse.updateMany(
        { 
            $expr: { 
                $or: [
                    { $eq: ['$stock', 0] },
                    { $lt: ['$stock', '$minimum'] }
                ]
            }
        },
        { status: 'hết hàng' }
    );
    
    // Cập nhật "sắp hết hàng" cho stock = minimum hoặc stock > minimum nhưng <= minimum + 5
    await Warehouse.updateMany(
        { 
            $expr: { 
                $or: [
                    { $eq: ['$stock', '$minimum'] },
                    {
                        $and: [
                            { $gt: ['$stock', '$minimum'] },
                            { $lte: ['$stock', { $add: ['$minimum', 5] }] }
                        ]
                    }
                ]
            }
        },
        { status: 'sắp hết hàng' }
    );
    
    // Cập nhật "còn hàng" cho stock > minimum + 5
    return Warehouse.updateMany(
        { $expr: { $gt: ['$stock', { $add: ['$minimum', 5] }] } },
        { status: 'còn hàng' }
    );
};

// Chạy cập nhật ban đầu khi khởi động
const Warehouse = mongoose.model('warehouse', WarehouseSchema);

// Thực hiện cập nhật ngay khi model được import
(async () => {
    try {
        await Warehouse.updateAllStatus();
        console.log('Initial warehouse status update completed');
    } catch (err) {
        console.error('Error updating warehouse status:', err);
    }
})();

module.exports = Warehouse;