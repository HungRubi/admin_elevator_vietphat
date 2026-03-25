const mongoose = require('mongoose');
const Receipts = require('../model/receipt.model');
const ReceiptDetail = require('../model/receiptDetail.model');
const { v4: uuidv4 } = require('uuid');
const { formatDate } = require('../../util/formatDate.util');
const { importDate } = require('../../util/importDate.util');
const Warehouse = require('../model/warehouse.model');
const { parseListQuery } = require('../../util/listQuery.util');

const RECEIPT_STATUSES = ['chưa xác nhận', 'đã xác nhận', 'đã hủy'];
const SORT_RECEIPT = ['createdAt', 'updatedAt', 'dateEntry', 'totalPrice', 'status', 'code'];

async function adjustWarehouseStock(productId, quantityDelta) {
    await Warehouse.findOneAndUpdate(
        { productId },
        { $inc: { stock: quantityDelta } },
        { upsert: true, new: true }
    );
}

class ReceiptController {
    /** [GET] /receipt */
    async index(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_RECEIPT,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const filter = search ? { code: { $regex: search, $options: 'i' } } : {};

            const [rows, total] = await Promise.all([
                Receipts.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate('supplier')
                    .lean(),
                Receipts.countDocuments(filter),
            ]);

            const formatReceipts = rows.map((receipt) => ({
                ...receipt,
                dateFormat: formatDate(receipt.dateEntry),
                updateFormat: formatDate(receipt.updatedAt),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            return res.status(200).json({
                receipts: formatReceipts,
                searchType: Boolean(search),
                receiptSearch: search ? formatReceipts : undefined,
                total,
                totalPages,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentOrder: orderLabel,
                currentReceipt: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi tải phiếu nhập',
            });
        }
    }

    /** [POST] /receipt/add */
    async add(req, res) {
        try {
            const { supplier, totalPrice, item } = req.body;

            if (!supplier || !mongoose.isValidObjectId(supplier)) {
                return res.status(400).json({ message: 'supplier không hợp lệ' });
            }
            if (!Array.isArray(item) || item.length === 0) {
                return res.status(400).json({ message: 'Danh sách item không hợp lệ' });
            }

            for (const line of item) {
                if (!line.product || !mongoose.isValidObjectId(line.product)) {
                    return res.status(400).json({ message: 'product trong item không hợp lệ' });
                }
                const qty = Number(line.quantity);
                const price = Number(line.price);
                if (!Number.isFinite(qty) || qty < 1) {
                    return res.status(400).json({ message: 'quantity không hợp lệ' });
                }
                if (!Number.isFinite(price) || price < 0) {
                    return res.status(400).json({ message: 'price không hợp lệ' });
                }
            }

            const code = uuidv4();
            const receipt = new Receipts({
                code,
                supplier,
                totalPrice: Number(totalPrice) || 0,
            });
            await receipt.save();
            const receiptId = receipt._id;

            const receiptDetails = item.map((line) => ({
                receipt: receiptId,
                product_id: line.product,
                quantity: Number(line.quantity),
                price: Number(line.price),
            }));
            await ReceiptDetail.insertMany(receiptDetails);

            res.status(200).json({
                message: 'Thêm phiếu nhập thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi tạo phiếu nhập',
            });
        }
    }

    /** [GET] /receipt/:id */
    async getReceipt(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }
            const receipt = await Receipts.findById(id).populate('supplier').lean();
            if (!receipt) {
                return res.status(404).json({
                    message: 'Không tìm thấy phiếu nhập',
                });
            }
            const receiptDetails = await ReceiptDetail.find({ receipt: id })
                .populate({
                    path: 'product_id',
                    populate: {
                        path: 'category',
                    },
                })
                .lean();
            const formatReceipt = {
                ...receipt,
                dateFormat: importDate(receipt.dateEntry),
                updateFormat: formatDate(receipt.updatedAt),
            };
            res.status(200).json({
                receipt: formatReceipt,
                receiptDetails,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi tải phiếu nhập',
            });
        }
    }

    /** [PUT] /receipt/:id */
    async updateReceipt(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }

            const { supplier, totalPrice, item, status, dateEntry } = req.body;
            const receipt = await Receipts.findById(id);
            if (!receipt) {
                return res.status(404).json({
                    message: 'Không tìm thấy phiếu nhập',
                });
            }

            if (!Array.isArray(item) || item.length === 0) {
                return res.status(400).json({ message: 'Danh sách item không hợp lệ' });
            }

            for (const line of item) {
                if (!line.product || !mongoose.isValidObjectId(line.product)) {
                    return res.status(400).json({ message: 'product trong item không hợp lệ' });
                }
                const qty = Number(line.quantity);
                const price = Number(line.price);
                if (!Number.isFinite(qty) || qty < 1) {
                    return res.status(400).json({ message: 'quantity không hợp lệ' });
                }
                if (!Number.isFinite(price) || price < 0) {
                    return res.status(400).json({ message: 'price không hợp lệ' });
                }
            }

            let newStatus = receipt.status;
            if (status !== undefined) {
                if (!RECEIPT_STATUSES.includes(status)) {
                    return res.status(400).json({ message: 'status không hợp lệ' });
                }
                newStatus = status;
            }

            const oldStatus = receipt.status;
            const oldDetails = await ReceiptDetail.find({ receipt: id }).lean();

            if (oldStatus === 'đã xác nhận') {
                for (const d of oldDetails) {
                    await adjustWarehouseStock(d.product_id, -d.quantity);
                }
            }

            if (supplier !== undefined) {
                if (!mongoose.isValidObjectId(supplier)) {
                    return res.status(400).json({ message: 'supplier không hợp lệ' });
                }
                receipt.supplier = supplier;
            }
            if (totalPrice !== undefined) {
                receipt.totalPrice = Number(totalPrice);
            }
            receipt.status = newStatus;
            if (dateEntry !== undefined) {
                receipt.dateEntry = new Date(dateEntry);
            }
            await receipt.save();

            await ReceiptDetail.deleteMany({ receipt: id });
            const receiptDetails = item.map((line) => ({
                receipt: id,
                product_id: line.product,
                quantity: Number(line.quantity),
                price: Number(line.price),
            }));
            await ReceiptDetail.insertMany(receiptDetails);

            if (newStatus === 'đã xác nhận') {
                for (const line of item) {
                    await adjustWarehouseStock(line.product, line.quantity);
                }
            }

            res.status(200).json({
                message: 'Cập nhật phiếu nhập thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi cập nhật phiếu nhập',
            });
        }
    }

    /** [DELETE] /receipt/:id */
    async deleteReceipt(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }

            const receipt = await Receipts.findById(id);
            if (!receipt) {
                return res.status(404).json({
                    message: 'Không tìm thấy phiếu nhập',
                });
            }

            const details = await ReceiptDetail.find({ receipt: id }).lean();

            if (receipt.status === 'đã xác nhận') {
                for (const detail of details) {
                    await adjustWarehouseStock(detail.product_id, -detail.quantity);
                }
            }

            await ReceiptDetail.deleteMany({ receipt: id });
            await Receipts.deleteOne({ _id: id });

            res.status(200).json({
                message: 'Xóa phiếu nhập thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi xóa phiếu nhập',
            });
        }
    }

    /** [GET] /receipt/filter */
    async filterReceipt(req, res) {
        try {
            const { status, startDate, endDate, timkiem, q } = req.query;
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                { ...req.query, timkiem: timkiem || q },
                {
                    allowedSortFields: SORT_RECEIPT,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const query = {};
            if (status) {
                if (!RECEIPT_STATUSES.includes(status)) {
                    return res.status(400).json({ message: 'status không hợp lệ' });
                }
                query.status = status;
            }
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                query.createdAt = {
                    $gte: start,
                    $lte: end,
                };
            }
            if (search) {
                query.code = { $regex: search, $options: 'i' };
            }

            const [rows, total] = await Promise.all([
                Receipts.find(query).sort(sort).skip(skip).limit(limit).populate('supplier').lean(),
                Receipts.countDocuments(query),
            ]);

            const formatReceipts = rows.map((receipt) => ({
                ...receipt,
                dateFormat: formatDate(receipt.dateEntry),
                updateFormat: formatDate(receipt.updatedAt),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                receipts: formatReceipts,
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
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }
}

module.exports = new ReceiptController();
