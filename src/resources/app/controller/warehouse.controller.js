const mongoose = require('mongoose');
const Warehouse = require('../model/warehouse.model');
const Product = require('../model/products.model');
const CategoryProduct = require('../model/categoryProduct.model');
const { formatDate } = require('../../util/formatDate.util');
const { parseListQuery } = require('../../util/listQuery.util');

const WAREHOUSE_STATUS = ['sắp hết hàng', 'còn hàng', 'hết hàng'];
const SORT_WAREHOUSE = ['stock', 'minimum', 'maximum', 'location', 'status', 'createdAt', 'updatedAt'];

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function invalidIdResponse(res) {
    return res.status(400).json({ message: 'Id không hợp lệ' });
}

function populateWarehouse() {
    return {
        path: 'productId',
        populate: [{ path: 'category' }, { path: 'supplier' }],
    };
}

/**
 * Tìm kho: theo location hoặc sản phẩm (tên SP / tên danh mục).
 * Không dùng regex trực tiếp trên ref ObjectId `category` (sai kiểu).
 */
async function buildWarehouseSearchFilter(search) {
    const term = String(search || '').trim();
    if (!term) return {};

    const regex = new RegExp(escapeRegex(term), 'i');
    const [byName, catIds] = await Promise.all([
        Product.find({ name: regex }).distinct('_id').lean(),
        CategoryProduct.find({ name: regex }).distinct('_id').lean(),
    ]);

    const byCategory =
        catIds.length > 0
            ? await Product.find({ category: { $in: catIds } }).distinct('_id').lean()
            : [];

    const idStr = new Set([...byName, ...byCategory].map((id) => id.toString()));
    const productObjectIds = [...idStr].map((id) => new mongoose.Types.ObjectId(id));

    const orClause = [{ location: regex }];
    if (productObjectIds.length > 0) {
        orClause.push({ productId: { $in: productObjectIds } });
    }
    return { $or: orClause };
}

function mergeWarehouseFilters(baseFilter, status, startDate, endDate) {
    const parts = [];
    if (baseFilter && Object.keys(baseFilter).length > 0) {
        parts.push(baseFilter);
    }
    if (status && WAREHOUSE_STATUS.includes(String(status))) {
        parts.push({ status: String(status) });
    }
    if (startDate && endDate && String(startDate) !== 'undefined' && String(endDate) !== 'undefined') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        parts.push({
            createdAt: {
                $gte: start,
                $lte: end,
            },
        });
    }
    if (parts.length === 0) return {};
    if (parts.length === 1) return parts[0];
    return { $and: parts };
}

class WarehouseController {
    /** [GET] /warehouse */
    async index(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(req.query, {
                allowedSortFields: SORT_WAREHOUSE,
                defaultSortField: 'updatedAt',
                defaultOrder: 'desc',
                defaultLimit: 10,
            });

            const searchFilter = search ? await buildWarehouseSearchFilter(search) : {};
            const filter = mergeWarehouseFilters(searchFilter, null, null, null);

            const [warehouses, total] = await Promise.all([
                Warehouse.find(filter)
                    .populate(populateWarehouse())
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Warehouse.countDocuments(filter),
            ]);

            const formatWarehouses = warehouses.map((warehouse) => ({
                ...warehouse,
                formatDate: formatDate(warehouse.updatedAt),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                searchType: Boolean(search),
                searchWarehouse: search ? formatWarehouses : undefined,
                warehouses: formatWarehouses,
                total,
                totalPages,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentWarehouse: orderLabel,
            });
        } catch (error) {
            console.error('Error fetching warehouse data:', error);
            res.status(500).json({ message: 'Lỗi server khi tải kho' });
        }
    }

    /** [DELETE] /warehouse/:id */
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return invalidIdResponse(res);
            }

            const warehouseProduct = await Warehouse.findById(id);
            if (!warehouseProduct) {
                return res.status(404).json({
                    message: 'Bản ghi kho không tồn tại',
                });
            }
            await Warehouse.deleteOne({ _id: id });
            return res.status(200).json({
                message: 'Xóa sản phẩm trong kho thành công',
            });
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            res.status(500).json({ message: 'Lỗi server khi xóa kho' });
        }
    }

    /** [GET] /warehouse/filter */
    async filterWarehouse(req, res) {
        try {
            const { status, startDate, endDate } = req.query;

            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(req.query, {
                allowedSortFields: SORT_WAREHOUSE,
                defaultSortField: 'updatedAt',
                defaultOrder: 'desc',
                defaultLimit: 10,
            });

            const searchFilter = search ? await buildWarehouseSearchFilter(search) : {};
            const filter = mergeWarehouseFilters(searchFilter, status, startDate, endDate);

            const [rows, total] = await Promise.all([
                Warehouse.find(filter)
                    .populate(populateWarehouse())
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Warehouse.countDocuments(filter),
            ]);

            const formatWarehouses = rows.map((warehouse) => ({
                ...warehouse,
                formatDate: formatDate(warehouse.updatedAt),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                warehouses: formatWarehouses,
                total,
                totalPages,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentWarehouse: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }
}

module.exports = new WarehouseController();
