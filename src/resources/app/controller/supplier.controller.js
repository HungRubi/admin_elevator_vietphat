const mongoose = require('mongoose');
const Suppliers = require('../model/supplier.model');
const { formatDate } = require('../../util/formatDate.util');
const Products = require('../model/products.model');
const { parseListQuery } = require('../../util/listQuery.util');

const SORT_SUPPLIER = ['name', 'createdAt', 'updatedAt', 'phone'];
const SORT_PRODUCT_BY_SUPPLIER = ['name', 'createdAt', 'updatedAt', 'price', 'sale', 'minimum', 'slug'];

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function invalidIdResponse(res) {
    return res.status(400).json({ message: 'Id không hợp lệ' });
}

class Supplier {
    /** [GET] /supplier */
    async index(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_SUPPLIER,
                    defaultSortField: 'name',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const filter = search
                ? { name: { $regex: escapeRegex(search), $options: 'i' } }
                : {};

            const [rows, total] = await Promise.all([
                Suppliers.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                Suppliers.countDocuments(filter),
            ]);

            const formatSupplier = rows.map((item) => ({
                ...item,
                formatDate: formatDate(item.createdAt),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            return res.status(200).json({
                supplier: formatSupplier,
                searchType: Boolean(search),
                total,
                totalPages,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentOrder: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server xin thử lại sau',
            });
        }
    }

    /** [POST] /supplier/add */
    async store(req, res) {
        try {
            const name = String(req.body?.name ?? '').trim();
            const phone = String(req.body?.phone ?? '').trim();
            const address = String(req.body?.address ?? '').trim();
            const email = String(req.body?.email ?? '').trim();

            if (!name || !phone || !address) {
                return res.status(400).json({
                    message: 'Thiếu name, phone hoặc address',
                });
            }

            const supplier = new Suppliers({
                name,
                phone,
                address,
                email: email || undefined,
            });
            await supplier.save();
            res.status(200).json({
                message: 'Thêm nhà cung cấp thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi thêm nhà cung cấp',
            });
        }
    }

    /** [GET] /supplier/edit/:id */
    async edit(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return invalidIdResponse(res);
            }

            const supplier = await Suppliers.findById(id).lean();
            if (!supplier) {
                return res.status(404).json({
                    message: 'Không tìm thấy nhà cung cấp',
                });
            }

            res.status(200).json({
                supplier,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi tải nhà cung cấp',
            });
        }
    }

    /** [PUT] /supplier/update/:id */
    async update(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return invalidIdResponse(res);
            }

            const name = String(req.body?.name ?? '').trim();
            const phone = String(req.body?.phone ?? '').trim();
            const address = String(req.body?.address ?? '').trim();
            const email = String(req.body?.email ?? '').trim();

            if (!name || !phone || !address) {
                return res.status(400).json({
                    message: 'Thiếu name, phone hoặc address',
                });
            }

            const supplier = await Suppliers.findByIdAndUpdate(
                id,
                {
                    name,
                    phone,
                    address,
                    email: email || undefined,
                },
                { new: true, runValidators: true }
            );
            if (!supplier) {
                return res.status(404).json({
                    message: 'Nhà cung cấp không tồn tại',
                });
            }
            res.status(200).json({
                message: 'Cập nhật nhà cung cấp thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi cập nhật nhà cung cấp',
            });
        }
    }

    /** [DELETE] /supplier/delete/:id */
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return invalidIdResponse(res);
            }

            const linked = await Products.countDocuments({ supplier: id });
            if (linked > 0) {
                return res.status(409).json({
                    message: `Không thể xóa: còn ${linked} sản phẩm gắn nhà cung cấp này`,
                });
            }

            const supplier = await Suppliers.findByIdAndDelete(id);
            if (!supplier) {
                return res.status(404).json({
                    message: 'Nhà cung cấp không tồn tại',
                });
            }

            res.status(200).json({
                message: 'Xóa nhà cung cấp thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi xóa nhà cung cấp',
            });
        }
    }

    /** [GET] /supplier/product/:id */
    async getProductBySupplier(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return invalidIdResponse(res);
            }

            const supplier = await Suppliers.findById(id).lean();
            if (!supplier) {
                return res.status(404).json({
                    message: 'Nhà cung cấp không tồn tại',
                });
            }

            const { limit, skip, page, sort } = parseListQuery(req.query, {
                allowedSortFields: SORT_PRODUCT_BY_SUPPLIER,
                defaultSortField: 'createdAt',
                defaultOrder: 'desc',
                defaultLimit: 20,
            });

            const [products, total] = await Promise.all([
                Products.find({ supplier: id })
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate('supplier')
                    .populate('category')
                    .lean(),
                Products.countDocuments({ supplier: id }),
            ]);

            const totalPages = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                products,
                total,
                totalPages,
                page,
                limit,
                offset: skip,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi tải sản phẩm theo nhà cung cấp',
            });
        }
    }
}

module.exports = new Supplier();
