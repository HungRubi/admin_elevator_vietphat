const mongoose = require('mongoose');
const Order = require('../model/orders.model');
const Warranty = require('../model/warranty.model');
const OrderDetail = require('../model/orderDetail.model');
const { formatDate } = require('../../util/formatDate.util');
const { importDate } = require('../../util/importDate.util');
const { v4: uuidv4 } = require('uuid');
const User = require('../model/user.model');
const Notification = require('../model/notification.model');
const WareHouse = require('../model/warehouse.model');
const { parseListQuery } = require('../../util/listQuery.util');

const WARRANTY_STATUS = ['đang xử lý', 'chấp thuận', 'bị hủy'];
const SORT_WARRANTY = [
    'code',
    'status',
    'quantity',
    'purchase_date',
    'warranty_date',
    'createdAt',
    'updatedAt',
];
const SORT_ORDER_ADD = ['createdAt', 'order_date', 'total_price'];
const MAX_WARRANTY_BATCH = 50;
const NOTIFICATION_TYPE = 'Thông báo hệ thống';

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function invalidIdResponse(res) {
    return res.status(400).json({ message: 'Id không hợp lệ' });
}

async function notifyAdmins(message) {
    const admins = await User.find({ authour: 'admin' }).select('_id').lean();
    await Promise.all(
        admins.map((user) =>
            new Notification({
                type: NOTIFICATION_TYPE,
                message,
                user_id: user._id,
            }).save()
        )
    );
}

class WarrantyController {
    /** [GET] /warranty */
    async index(req, res) {
        try {
            const { limit, skip, page, sort, sortField: sf, orderLabel, search } = parseListQuery(req.query, {
                allowedSortFields: SORT_WARRANTY,
                defaultSortField: 'updatedAt',
                defaultOrder: 'desc',
                defaultLimit: 10,
            });

            const filter = search
                ? { code: { $regex: escapeRegex(search), $options: 'i' } }
                : {};

            const [warranties, total] = await Promise.all([
                Warranty.find(filter)
                    .populate({
                        path: 'product_id',
                        populate: { path: 'category' },
                    })
                    .populate('user_id')
                    .populate('order_code')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Warranty.countDocuments(filter),
            ]);

            const formatWarranties = warranties.map((warranty) => ({
                ...warranty,
                purchaseDate: formatDate(warranty.purchase_date),
                warrantyDate: formatDate(warranty.warranty_date),
                createTime: formatDate(warranty.createdAt),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            return res.status(200).json({
                searchType: Boolean(search),
                searchWarranty: search ? formatWarranties : undefined,
                warranties: formatWarranties,
                total,
                totalPages,
                page,
                limit,
                offset: skip,
                currentSort: sf,
                currentWarranty: orderLabel,
            });
        } catch (error) {
            console.error('Error fetching warranty data:', error);
            res.status(500).json({ message: 'Lỗi server khi tải phiếu bảo hành' });
        }
    }

    /** [GET] /warranty/add — đơn thành công + chi tiết (batch, có phân trang) */
    async add(req, res) {
        try {
            const { limit, skip, page, sort } = parseListQuery(req.query, {
                allowedSortFields: SORT_ORDER_ADD,
                defaultSortField: 'createdAt',
                defaultOrder: 'desc',
                defaultLimit: 30,
            });

            const orderFilter = { status: 'Thành công' };

            const [orders, total] = await Promise.all([
                Order.find(orderFilter).sort(sort).skip(skip).limit(limit).lean(),
                Order.countDocuments(orderFilter),
            ]);

            const orderIds = orders.map((o) => o._id);
            const allDetails =
                orderIds.length > 0
                    ? await OrderDetail.find({ order_id: { $in: orderIds } })
                          .populate({
                              path: 'product_id',
                              populate: { path: 'category' },
                          })
                          .lean()
                    : [];

            const detailsByOrder = {};
            for (const d of allDetails) {
                const k = d.order_id.toString();
                if (!detailsByOrder[k]) detailsByOrder[k] = [];
                detailsByOrder[k].push(d);
            }

            const orderFormat = orders.map((order) => ({
                ...order,
                orderDetail: detailsByOrder[order._id.toString()] || [],
                orderDate: importDate(order.order_date),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                orders: orderFormat,
                total,
                totalPages,
                page,
                limit,
                offset: skip,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [POST] /warranty/store */
    async store(req, res) {
        try {
            const {
                order_code,
                user_id,
                address,
                products,
                purchase_date,
                warranty_date,
                description,
                video,
                status,
            } = req.body;

            const list = Array.isArray(products) ? products : null;
            if (!list || list.length === 0 || list.length > MAX_WARRANTY_BATCH) {
                return res.status(400).json({
                    message: `products phải là mảng 1–${MAX_WARRANTY_BATCH} phần tử`,
                });
            }

            if (!mongoose.isValidObjectId(order_code) || !mongoose.isValidObjectId(user_id)) {
                return res.status(400).json({ message: 'order_code hoặc user_id không hợp lệ' });
            }

            const addressT = String(address ?? '').trim();
            const descriptionT = String(description ?? '').trim();
            if (!addressT || !descriptionT) {
                return res.status(400).json({ message: 'Thiếu address hoặc description' });
            }
            if (!purchase_date || !warranty_date) {
                return res.status(400).json({ message: 'Thiếu purchase_date hoặc warranty_date' });
            }
            if (!status || !WARRANTY_STATUS.includes(String(status))) {
                return res.status(400).json({ message: 'status không hợp lệ' });
            }

            for (const item of list) {
                const pid = item?.product_id ?? item?._id;
                const qty = Number(item?.quantity);
                if (!mongoose.isValidObjectId(pid) || !Number.isFinite(qty) || qty < 1) {
                    return res.status(400).json({ message: 'product_id hoặc quantity không hợp lệ' });
                }
            }

            const orderExists = await Order.exists({ _id: order_code, status: 'Thành công' });
            if (!orderExists) {
                return res.status(400).json({ message: 'Đơn hàng không tồn tại hoặc chưa thành công' });
            }

            for (const item of list) {
                const pid = item.product_id ?? item._id;
                const code = uuidv4();
                const warranty = new Warranty({
                    code,
                    order_code,
                    user_id,
                    address: addressT,
                    product_id: pid,
                    quantity: Number(item.quantity),
                    purchase_date,
                    warranty_date,
                    description: descriptionT,
                    video: video != null && video !== '' ? String(video) : undefined,
                    status,
                });
                await warranty.save();
            }

            const orderRef = await Order.findById(order_code).select('order_code').lean();
            const orderLabel = orderRef?.order_code || String(order_code);

            await notifyAdmins(`${list.length} phiếu bảo hành mới cho đơn ${orderLabel}`);

            for (const item of list) {
                const pid = item.product_id ?? item._id;
                await WareHouse.findOneAndUpdate(
                    { productId: pid },
                    { $inc: { stock: -Number(item.quantity) } },
                    { upsert: true, new: true }
                );
            }

            res.status(200).json({
                message: 'Thêm phiếu bảo hành thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [GET] /warranty/:id */
    async detail(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return invalidIdResponse(res);
            }

            const warranty = await Warranty.findById(id)
                .populate('user_id')
                .populate('order_code')
                .populate({
                    path: 'product_id',
                    populate: { path: 'category' },
                })
                .lean();
            if (!warranty) {
                return res.status(404).json({
                    message: 'Không tìm thấy phiếu bảo hành',
                });
            }
            const formatWarranty = {
                ...warranty,
                purchaseDate: importDate(warranty.purchase_date),
                warrantyDate: importDate(warranty.warranty_date),
            };
            res.status(200).json({
                warranty: formatWarranty,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [PUT] /warranty/:id */
    async update(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return invalidIdResponse(res);
            }

            const existing = await Warranty.findById(id);
            if (!existing) {
                return res.status(404).json({ message: 'Không tìm thấy phiếu bảo hành' });
            }

            const {
                order_code,
                user_id,
                address,
                products,
                description,
                video,
                purchase_date,
                warranty_date,
                status,
            } = req.body;

            const productPayload = products;
            const newProductRaw = productPayload?.product_id ?? productPayload?._id;
            const newQty = Number(productPayload?.quantity);

            if (!mongoose.isValidObjectId(order_code) || !mongoose.isValidObjectId(user_id)) {
                return res.status(400).json({ message: 'order_code hoặc user_id không hợp lệ' });
            }
            if (!mongoose.isValidObjectId(newProductRaw) || !Number.isFinite(newQty) || newQty < 1) {
                return res.status(400).json({ message: 'products.product_id và quantity không hợp lệ' });
            }

            const addressT = String(address ?? '').trim();
            const descriptionT = String(description ?? '').trim();
            if (!addressT || !descriptionT) {
                return res.status(400).json({ message: 'Thiếu address hoặc description' });
            }
            if (!purchase_date || !warranty_date) {
                return res.status(400).json({ message: 'Thiếu purchase_date hoặc warranty_date' });
            }
            if (!status || !WARRANTY_STATUS.includes(String(status))) {
                return res.status(400).json({ message: 'status không hợp lệ' });
            }

            const newPid = new mongoose.Types.ObjectId(newProductRaw);

            await Warranty.findByIdAndUpdate(
                id,
                {
                    order_code,
                    user_id,
                    address: addressT,
                    product_id: newPid,
                    quantity: newQty,
                    description: descriptionT,
                    video: video != null && video !== '' ? String(video) : undefined,
                    purchase_date,
                    warranty_date,
                    status,
                },
                { new: true, runValidators: true }
            );

            await notifyAdmins(`Phiếu bảo hành ${existing.code} đã được cập nhật`);

            const oldPid = existing.product_id;
            const oldQty = existing.quantity;

            if (oldPid.toString() === newPid.toString()) {
                const diff = newQty - oldQty;
                if (diff !== 0) {
                    await WareHouse.findOneAndUpdate(
                        { productId: oldPid },
                        { $inc: { stock: -diff } },
                        { upsert: true, new: true }
                    );
                }
            } else {
                await WareHouse.findOneAndUpdate(
                    { productId: oldPid },
                    { $inc: { stock: oldQty } },
                    { upsert: true, new: true }
                );
                await WareHouse.findOneAndUpdate(
                    { productId: newPid },
                    { $inc: { stock: -newQty } },
                    { upsert: true, new: true }
                );
            }

            res.status(200).json({
                message: 'Cập nhật phiếu bảo hành thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [DELETE] /warranty/:id */
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return invalidIdResponse(res);
            }

            const warranty = await Warranty.findById(id);
            if (!warranty) {
                return res.status(404).json({
                    message: 'Không tìm thấy phiếu bảo hành',
                });
            }
            await Warranty.findByIdAndDelete(id);

            await notifyAdmins(`Phiếu bảo hành ${warranty.code} đã bị xóa`);

            await new Notification({
                type: NOTIFICATION_TYPE,
                message: `Phiếu bảo hành ${warranty.code} đã bị xóa`,
                user_id: warranty.user_id,
            }).save();

            await WareHouse.findOneAndUpdate(
                { productId: warranty.product_id },
                { $inc: { stock: warranty.quantity } },
                { upsert: true, new: true }
            );

            res.status(200).json({
                message: 'Xóa phiếu bảo hành thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [GET] /warranty/filter */
    async filterWarranty(req, res) {
        try {
            const { status, startDate, endDate } = req.query;

            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(req.query, {
                allowedSortFields: SORT_WARRANTY,
                defaultSortField: 'updatedAt',
                defaultOrder: 'desc',
                defaultLimit: 10,
            });

            const query = {};
            if (status && WARRANTY_STATUS.includes(String(status))) {
                query.status = String(status);
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
                query.code = { $regex: escapeRegex(search), $options: 'i' };
            }

            const [rows, total] = await Promise.all([
                Warranty.find(query)
                    .populate('user_id')
                    .populate({
                        path: 'product_id',
                        populate: { path: 'category' },
                    })
                    .populate('order_code')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Warranty.countDocuments(query),
            ]);

            const formatWarranties = rows.map((warranty) => ({
                ...warranty,
                purchaseDate: formatDate(warranty.purchase_date),
                warrantyDate: formatDate(warranty.warranty_date),
                createTime: formatDate(warranty.createdAt),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                warranties: formatWarranties,
                total,
                totalPages,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentWarranty: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }
}

module.exports = new WarrantyController();
