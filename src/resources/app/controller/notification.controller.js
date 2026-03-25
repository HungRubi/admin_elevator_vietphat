const mongoose = require('mongoose');
const { formatDate } = require('../../util/formatDate.util');
const { parseListQuery } = require('../../util/listQuery.util');
const Notification = require('../model/notification.model');
const User = require('../model/user.model');
const { getTimeAgo } = require('../../util/formatTime.util');

const NOTIFICATION_TYPES = [
    'Thông báo hệ thống',
    'Thông báo đơn hàng',
    'Thông báo khách hàng',
];

const SORT_NOTIFICATION = ['createdAt', 'updatedAt', 'type', 'message', 'isRead'];

function assertSelfUserId(req, paramUserId) {
    if (!req.user || String(req.user.id) !== String(paramUserId)) {
        return {
            ok: false,
            status: 403,
            message: 'Chỉ được xem thông báo của tài khoản đang đăng nhập.',
        };
    }
    return { ok: true };
}

class NotificationController {
    /** [GET] /notification — staff */
    async getNotification(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_NOTIFICATION,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            let filter = {};
            if (search) {
                const users = await User.find({
                    name: { $regex: search, $options: 'i' },
                })
                    .select('_id')
                    .lean();
                const userIds = users.map((u) => u._id);
                const messageFilter = { message: { $regex: search, $options: 'i' } };
                if (userIds.length === 0) {
                    filter = messageFilter;
                } else {
                    filter = {
                        $or: [{ user_id: { $in: userIds } }, messageFilter],
                    };
                }
            }

            const [rows, total] = await Promise.all([
                Notification.find(filter)
                    .sort(sort)
                    .populate('user_id')
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Notification.countDocuments(filter),
            ]);

            const format = rows.map((item) => ({
                ...item,
                lastUpdate: formatDate(item.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                notifications: format,
                searchType: Boolean(search),
                searchNotification: search ? format : undefined,
                total,
                totalPage,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentNotification: orderLabel,
                sortNotification: orderLabel,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [POST] /notification/add — staff */
    async addNotification(req, res) {
        try {
            const { type, message, user_id } = req.body;

            if (!message || String(message).trim() === '') {
                return res.status(400).json({ message: 'message là bắt buộc' });
            }

            const doc = {
                message: String(message).trim(),
            };

            if (type && NOTIFICATION_TYPES.includes(type)) {
                doc.type = type;
            }

            if (user_id) {
                if (!mongoose.isValidObjectId(user_id)) {
                    return res.status(400).json({ message: 'user_id không hợp lệ' });
                }
                const user = await User.findById(user_id);
                if (!user) {
                    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
                }
                doc.user_id = user_id;
            }

            await new Notification(doc).save();

            res.status(200).json({
                message: 'Thêm thông báo thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [GET] /notification/:id — staff */
    async editNotification(req, res) {
        try {
            const notificationId = req.params.id;
            if (!mongoose.isValidObjectId(notificationId)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }
            const notifi = await Notification.findById(notificationId).populate('user_id').lean();
            if (!notifi) {
                return res.status(404).json({
                    message: 'Thông báo không tồn tại',
                });
            }
            return res.status(200).json({
                notification: notifi,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [PUT] /notification/:id — staff */
    async updateNotification(req, res) {
        try {
            const notificationId = req.params.id;
            if (!mongoose.isValidObjectId(notificationId)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }

            const $set = {};
            const $unset = {};
            if (req.body.type !== undefined && NOTIFICATION_TYPES.includes(req.body.type)) {
                $set.type = req.body.type;
            }
            if (req.body.message !== undefined) {
                $set.message = String(req.body.message).trim();
            }
            if (req.body.isRead !== undefined) {
                $set.isRead = Boolean(req.body.isRead);
            }
            if (req.body.user_id !== undefined) {
                if (req.body.user_id === null || req.body.user_id === '') {
                    $unset.user_id = '';
                } else if (mongoose.isValidObjectId(req.body.user_id)) {
                    $set.user_id = req.body.user_id;
                } else {
                    return res.status(400).json({ message: 'user_id không hợp lệ' });
                }
            }

            if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
                return res.status(400).json({ message: 'Không có trường hợp lệ để cập nhật' });
            }

            const updateDoc = {};
            if (Object.keys($set).length) updateDoc.$set = $set;
            if (Object.keys($unset).length) updateDoc.$unset = $unset;

            const result = await Notification.updateOne({ _id: notificationId }, updateDoc);
            if (result.matchedCount === 0) {
                return res.status(404).json({
                    message: 'Thông báo không tồn tại',
                });
            }

            return res.status(200).json({
                message: 'Cập nhật thông báo thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [DELETE] /notification/:id — staff */
    async deleteNotification(req, res) {
        try {
            const notificationId = req.params.id;
            if (!mongoose.isValidObjectId(notificationId)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }
            const result = await Notification.deleteOne({ _id: notificationId });
            if (result.deletedCount === 0) {
                return res.status(404).json({
                    message: 'Thông báo không tồn tại',
                });
            }
            return res.status(200).json({
                message: 'Xóa thông báo thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [PUT] /notification/read/:id — customer: chỉ đánh dấu đọc thông báo của chính user */
    async isReadNotification(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }

            const notifi = await Notification.findById(id);
            if (!notifi) {
                return res.status(404).json({ message: 'Thông báo không tồn tại' });
            }

            if (
                !notifi.user_id ||
                String(notifi.user_id) !== String(req.user.id)
            ) {
                return res.status(403).json({
                    message: 'Không được đánh dấu đọc thông báo này.',
                });
            }

            const patch = {};
            if (req.body.isRead !== undefined) {
                patch.isRead = Boolean(req.body.isRead);
            } else {
                patch.isRead = true;
            }

            await Notification.updateOne({ _id: id }, { $set: patch });

            const myNotifi = await Notification.find({ user_id: req.user.id })
                .sort({ createdAt: -1 })
                .lean();
            const formatNotifi = myNotifi.map((item) => ({
                ...item,
                timeAgo: getTimeAgo(item.createdAt),
            }));

            res.status(200).json({
                myNotifi: formatNotifi,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [GET] /notification/all/:id — customer: chỉ danh sách của chính user */
    async getAllNotifiByUser(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ message: 'ID không hợp lệ' });
            }

            const check = assertSelfUserId(req, id);
            if (!check.ok) {
                return res.status(check.status).json({ message: check.message });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    message: 'Không tìm thấy người dùng',
                });
            }

            const { limit, skip, page, sort, sortField, orderLabel } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_NOTIFICATION,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 30,
                }
            );

            const baseFilter = {
                $or: [{ user_id: id }, { type: 'Thông báo hệ thống' }],
            };

            const [rows, total] = await Promise.all([
                Notification.find(baseFilter).sort(sort).skip(skip).limit(limit).lean(),
                Notification.countDocuments(baseFilter),
            ]);

            const formatNotifi = rows.map((item) => ({
                ...item,
                timeAgo: getTimeAgo(item.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                myNotifi: formatNotifi,
                total,
                totalPage,
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

    /** [GET] /notification/filter — staff */
    async filterNotification(req, res) {
        try {
            const { type, startDate, endDate, timkiem, q } = req.query;
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                { ...req.query, timkiem: timkiem || q },
                {
                    allowedSortFields: SORT_NOTIFICATION,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const query = {};
            if (type && type !== 'undefined' && String(type).trim() !== '') {
                const t = String(type).trim();
                if (NOTIFICATION_TYPES.includes(t)) {
                    query.type = t;
                } else {
                    return res.status(400).json({ message: 'type không hợp lệ' });
                }
            }
            if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt = {
                    $gte: start,
                    $lte: end,
                };
            }
            if (search) {
                query.message = { $regex: search, $options: 'i' };
            }

            const [notifications, total] = await Promise.all([
                Notification.find(query)
                    .populate('user_id')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Notification.countDocuments(query),
            ]);

            const format = notifications.map((item) => ({
                ...item,
                lastUpdate: formatDate(item.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                notifications: format,
                total,
                totalPage,
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

module.exports = new NotificationController();
