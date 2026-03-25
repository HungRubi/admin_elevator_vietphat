const mongoose = require('mongoose');
const User = require('../model/user.model');
const Orders = require('../model/orders.model');
const OrderDetail = require('../model/orderDetail.model');
const { formatDate } = require('../../util/formatDate.util');
const { importDate } = require('../../util/importDate.util');
const Product = require('../model/products.model');
const Cart = require('../model/cart.model');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { parseListQuery } = require('../../util/listQuery.util');

const SORT_USER = ['name', 'createdAt', 'updatedAt', 'email', 'phone', 'lastLogin', 'authour'];
const SORT_ORDER = ['createdAt', 'updatedAt', 'order_date', 'total_price', 'status'];
const AUTHOURS = ['customer', 'employee', 'admin'];
const DEFAULT_AVATAR =
    'https://www.dropbox.com/scl/fi/896n7adhufqiu2hlt94u5/default.png?rlkey=gk9thmq6u1grzss8o0c3os39f&st=83b9myer&dl=1';
const AVATAR_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
const NEW_USER_DAYS_MIN = 1;
const NEW_USER_DAYS_MAX = 90;

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function invalidIdResponse(res) {
    return res.status(400).json({ message: 'Id không hợp lệ' });
}

function resolveAuthourOnCreate(reqBodyAuthour, requesterAuthor) {
    const raw = String(reqBodyAuthour || '').trim();
    if (requesterAuthor === 'admin' && AUTHOURS.includes(raw)) {
        return raw;
    }
    return 'customer';
}

class UserController {
    /** [GET] /user */
    async getUser(req, res, next) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(req.query, {
                allowedSortFields: SORT_USER,
                defaultSortField: 'name',
                defaultOrder: 'asc',
                defaultLimit: 10,
            });

            const filter = search
                ? { name: { $regex: escapeRegex(search), $options: 'i' } }
                : {};

            const [rows, total] = await Promise.all([
                User.find(filter).select('-password').sort(sort).skip(skip).limit(limit).lean(),
                User.countDocuments(filter),
            ]);

            const userFormart = rows.map((user) => ({
                ...user,
                birthFormat: formatDate(user.birth),
                lastLoginFormat: formatDate(user.lastLogin),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            return res.status(200).json({
                data: {
                    formatUser: userFormart,
                    searchUser: search ? userFormart : undefined,
                    searchType: Boolean(search),
                    totalUser: total,
                    totalPages,
                    page,
                    limit,
                    offset: skip,
                    currentSort: sortField,
                    currentOrder: orderLabel,
                },
            });
        } catch (err) {
            next(err);
        }
    }

    /** [GET] /user/:id */
    async getUserDetail(req, res, next) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return invalidIdResponse(res);
            }

            const user = await User.findById(id).select('-password').lean();
            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }

            const formatBirth = {
                ...user,
                birthFormated: importDate(user.birth),
            };
            return res.status(200).json({ data: { user: formatBirth } });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Lỗi server khi tải người dùng' });
        }
    }

    /** [PUT] /user/update/address/:id */
    async updateAddress(req, res, next) {
        try {
            const userId = req.params.id;
            if (!mongoose.isValidObjectId(userId)) {
                return invalidIdResponse(res);
            }

            const address = String(req.body?.address ?? '').trim();
            if (!address) {
                return res.status(400).json({ message: 'Thiếu địa chỉ (address)' });
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: { address } },
                { new: true, runValidators: true }
            ).select('-password');

            if (!updatedUser) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            res.status(200).json({
                updatedUser,
                message: 'Cập nhật địa chỉ thành công',
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Lỗi khi cập nhật địa chỉ' });
        }
    }

    /** [GET] /user/order/:id */
    async getOrder(req, res) {
        try {
            const userId = req.params.id;
            if (!mongoose.isValidObjectId(userId)) {
                return invalidIdResponse(res);
            }

            const userExists = await User.exists({ _id: userId });
            if (!userExists) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            const { limit, skip, page, sort } = parseListQuery(req.query, {
                allowedSortFields: SORT_ORDER,
                defaultSortField: 'createdAt',
                defaultOrder: 'desc',
                defaultLimit: 20,
            });

            const orderFilter = { user_id: userId };

            const [orders, total, failedOrdersCount] = await Promise.all([
                Orders.find(orderFilter).sort(sort).skip(skip).limit(limit).lean(),
                Orders.countDocuments(orderFilter),
                Orders.countDocuments({ ...orderFilter, status: 'Thất bại' }),
            ]);

            const orderIds = orders.map((item) => item._id);

            const formattedOrders = orders.map((order) => ({
                ...order,
                createdAtFormatted: order.createdAt
                    ? new Date(order.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                      })
                    : '',
            }));

            const orderDetails =
                orderIds.length > 0
                    ? await OrderDetail.find({ order_id: { $in: orderIds } }).lean()
                    : [];
            const productIdStrs = [...new Set(orderDetails.map((item) => item.product_id.toString()))];
            const products =
                productIdStrs.length > 0
                    ? await Product.find({
                          _id: { $in: productIdStrs.map((id) => new mongoose.Types.ObjectId(id)) },
                      }).lean()
                    : [];

            const productMap = {};
            products.forEach((p) => {
                productMap[p._id.toString()] = p;
            });

            const orderDetailsWithProducts = orderDetails.map((detail) => {
                const product = productMap[detail.product_id.toString()];
                return {
                    ...detail,
                    product,
                };
            });

            const orderDetailMap = {};
            orderDetailsWithProducts.forEach((detail) => {
                const key = detail.order_id.toString();
                if (!orderDetailMap[key]) {
                    orderDetailMap[key] = [];
                }
                orderDetailMap[key].push(detail);
            });

            const ordersWithDetails = formattedOrders.map((order) => ({
                ...order,
                orderDetails: orderDetailMap[order._id.toString()] || [],
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                order: ordersWithDetails,
                total,
                totalPages,
                page,
                limit,
                offset: skip,
                failedOrdersCount,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi tải đơn hàng',
            });
        }
    }

    /** [POST] /user/store */
    async store(req, res) {
        try {
            const {
                name,
                email,
                phone,
                address,
                birth,
                account,
                avatar,
                password,
                comfirm_password,
                confirm_password,
                authour,
            } = req.body;

            const passwordConfirm = comfirm_password ?? confirm_password;

            const nameT = String(name ?? '').trim();
            const emailT = String(email ?? '').trim().toLowerCase();
            const phoneT = String(phone ?? '').trim();
            const addressT = String(address ?? '').trim();
            const accountT = String(account ?? '').trim();

            if (!nameT || !emailT || !phoneT || !addressT || !accountT || !password) {
                return res.status(400).json({
                    message: 'Thiếu thông tin bắt buộc',
                });
            }

            const requesterAuthor = req.user?.author;
            const role = resolveAuthourOnCreate(authour, requesterAuthor);

            const existingEmail = await User.findOne({ email: emailT });
            if (existingEmail) {
                return res.status(400).json({
                    message: 'Email đã được đăng ký rồi',
                });
            }
            const existingAccount = await User.findOne({ account: accountT });
            if (existingAccount) {
                return res.status(400).json({
                    message: 'Tài khoản đã được đăng ký rồi',
                });
            }
            if (password !== passwordConfirm) {
                return res.status(400).json({
                    message: 'Mật khẩu không trùng nhau',
                });
            }

            const finalAvatar =
                avatar === '' || avatar === undefined || avatar === null
                    ? DEFAULT_AVATAR
                    : String(avatar).trim() || DEFAULT_AVATAR;

            const hashPassword = await bcrypt.hash(String(password), 10);
            const user = new User({
                name: nameT,
                email: emailT,
                phone: phoneT,
                address: addressT,
                birth: birth || undefined,
                account: accountT,
                avatar: finalAvatar,
                password: hashPassword,
                authour: role,
            });
            await user.save();
            res.status(200).json({
                message: 'Thêm user thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server khi thêm người dùng',
            });
        }
    }

    /** [GET] /user/filter */
    async filterUser(req, res) {
        try {
            const { authour, start_date, end_date } = req.query;

            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(req.query, {
                allowedSortFields: SORT_USER,
                defaultSortField: 'createdAt',
                defaultOrder: 'desc',
                defaultLimit: 10,
            });

            const query = {};
            if (authour && AUTHOURS.includes(String(authour))) {
                query.authour = authour;
            }
            if (start_date && end_date) {
                const end = new Date(end_date);
                end.setHours(23, 59, 59, 999);
                query.createdAt = {
                    $gte: new Date(start_date),
                    $lte: end,
                };
            }
            if (search) {
                query.name = { $regex: escapeRegex(search), $options: 'i' };
            }

            const [user, total] = await Promise.all([
                User.find(query).select('-password').sort(sort).skip(skip).limit(limit).lean(),
                User.countDocuments(query),
            ]);

            const formatUser = user.map((u) => ({
                ...u,
                birthFormat: formatDate(u.birth),
                lastLoginFormat: formatDate(u.lastLogin),
            }));

            const totalPages = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                formatUser,
                totalUser: total,
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
                message: 'Lỗi server hãy thử lại sau',
            });
        }
    }

    /** [DELETE] /user/:id */
    async destroy(req, res) {
        try {
            const userId = req.params.id;
            if (!mongoose.isValidObjectId(userId)) {
                return invalidIdResponse(res);
            }

            const target = await User.findById(userId).select('authour').lean();
            if (!target) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            const requesterAuthor = req.user?.author;
            if (requesterAuthor === 'employee' && target.authour !== 'customer') {
                return res.status(403).json({
                    message: 'Chỉ admin được xóa tài khoản nhân viên hoặc quản trị',
                });
            }

            const result = await User.deleteOne({ _id: userId });
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }
            await Cart.deleteOne({ userId: userId });
            res.status(200).json({
                message: 'Xóa người dùng thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [GET] /user/new */
    async getNewUser(req, res) {
        try {
            let start;
            let end;
            let daySpan;

            const { startDate, endDate, days: daysRaw } = req.query;

            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
                const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
                const inclusiveDays = Math.floor((utcEnd - utcStart) / (24 * 60 * 60 * 1000)) + 1;
                daySpan = Math.max(1, Math.min(NEW_USER_DAYS_MAX, inclusiveDays));
            } else {
                const days = Math.min(
                    NEW_USER_DAYS_MAX,
                    Math.max(NEW_USER_DAYS_MIN, parseInt(String(daysRaw || 7), 10) || 7)
                );
                end = new Date();
                start = new Date();
                start.setDate(end.getDate() - (days - 1));
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                daySpan = days;
            }

            const customerStats = await User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        authour: 'customer',
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' },
                        },
                        customers: { $sum: 1 },
                        date: { $first: '$createdAt' },
                    },
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
                },
            ]);

            const totalCustomers = customerStats.reduce((sum, stat) => sum + stat.customers, 0);
            const average = Math.round(totalCustomers / daySpan);

            const formattedData = [];
            const currentDate = new Date(start);

            for (let i = 0; i < daySpan; i++) {
                const dateStr = formatDate(currentDate);
                const existingStat = customerStats.find((stat) => {
                    const statDate = new Date(stat.date);
                    return statDate.toDateString() === currentDate.toDateString();
                });

                formattedData.push({
                    day: dateStr,
                    customers: existingStat ? existingStat.customers : 0,
                    average,
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }

            const totalNewCustomers = formattedData.reduce((sum, data) => sum + data.customers, 0);

            const previousPeriodStart = new Date(start);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - daySpan);
            const previousPeriodEnd = new Date(start);
            previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
            previousPeriodEnd.setHours(23, 59, 59, 999);

            const previousCustomers = await User.countDocuments({
                createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
                authour: 'customer',
            });

            const growthPercentage =
                previousCustomers > 0
                    ? (((totalNewCustomers - previousCustomers) / previousCustomers) * 100).toFixed(1)
                    : totalNewCustomers > 0
                      ? '100.0'
                      : '0';

            res.status(200).json({
                success: true,
                chartData: formattedData,
                summary: {
                    totalNewCustomers,
                    growthPercentage,
                    startDate: formatDate(start),
                    endDate: formatDate(end),
                    averagePerDay: average,
                },
            });
        } catch (error) {
            console.error('Error fetching customer analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thống kê khách hàng',
            });
        }
    }

    /** [PUT] /user/profile/update/:id */
    async updateProfileUser(req, res) {
        try {
            const user_id = req.params.id;
            if (!mongoose.isValidObjectId(user_id)) {
                return invalidIdResponse(res);
            }

            const name = String(req.body?.name ?? '').trim();
            const email = String(req.body?.email ?? '').trim().toLowerCase();
            const phone = String(req.body?.phone ?? '').trim();
            const birth = req.body?.birth;
            const avatar = req.body?.avatar;

            if (!name || !email || !phone) {
                return res.status(400).json({ message: 'Thiếu name, email hoặc phone' });
            }

            const user = await User.findById(user_id);
            if (!user) {
                return res.status(404).json({
                    message: 'Không tìm thấy người dùng',
                });
            }

            const emailTaken = await User.findOne({
                email,
                _id: { $ne: user_id },
            }).lean();
            if (emailTaken) {
                return res.status(400).json({ message: 'Email đã được sử dụng' });
            }

            if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image')) {
                const matches = avatar.match(/^data:(image\/\w+);base64,(.+)$/);
                if (!matches || matches.length !== 3) {
                    return res.status(400).json({ message: 'Ảnh không hợp lệ!' });
                }

                const imageBuffer = Buffer.from(matches[2], 'base64');
                if (imageBuffer.length > AVATAR_UPLOAD_MAX_BYTES) {
                    return res.status(400).json({ message: 'Ảnh vượt quá dung lượng cho phép (2MB)' });
                }

                const imageType = matches[1].split('/')[1];
                const fileName = `avatar_${Date.now()}.${imageType}`;
                const uploadDir = path.join(process.cwd(), 'uploads');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const savePath = path.join(uploadDir, fileName);
                fs.writeFileSync(savePath, imageBuffer);
                user.avatar = `/uploads/${fileName}`;
            }

            user.birth = birth || user.birth;
            user.name = name;
            user.email = email;
            user.phone = phone;
            await user.save();

            const safe = await User.findById(user_id).select('-password').lean();
            res.status(200).json({
                user: safe,
                message: 'Cập nhật hồ sơ thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }
}

module.exports = new UserController();
