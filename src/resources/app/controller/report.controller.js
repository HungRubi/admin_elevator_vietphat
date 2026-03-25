const mongoose = require('mongoose');
const Order = require('../model/orders.model');
const DetailOrder = require('../model/orderDetail.model');
const {
    getDateRange,
    getStartOfWeek,
    getStartOfMonth,
    getStartOfYear,
    getEndOfMonth,
    getEndOfYear,
    getEndOfWeek,
} = require('../../util/formatTime.util');
const moment = require('moment');
const User = require('../model/user.model');
const Product = require('../model/products.model');
const Comment = require('../model/comments.model');
const Warehouse = require('../model/warehouse.model');

/** Chuỗi YYYY-MM-DD từ formatTime → Date đầu/cuối ngày */
function dayStartFromYMD(s) {
    const parts = String(s).split('-').map(Number);
    if (parts.length !== 3) return new Date(s);
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

function dayEndFromYMD(s) {
    const parts = String(s).split('-').map(Number);
    if (parts.length !== 3) return new Date(s);
    return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
}

/**
 * Kỳ trước để so sánh % (cùng độ dài kỳ gần đúng).
 */
function getPreviousPeriod(date) {
    switch (date) {
        case 'hôm nay':
            return getDateRange('yesterday');
        case 'hôm qua': {
            const d = new Date();
            d.setDate(d.getDate() - 2);
            const start = new Date(d);
            start.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        }
        case 'tuần này': {
            const startOfThisWeek = dayStartFromYMD(getStartOfWeek());
            const startOfLastWeek = new Date(startOfThisWeek);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
            const endOfLastWeek = new Date(startOfThisWeek);
            endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
            endOfLastWeek.setHours(23, 59, 59, 999);
            startOfLastWeek.setHours(0, 0, 0, 0);
            return { start: startOfLastWeek, end: endOfLastWeek };
        }
        case 'tháng này': {
            const startOfThisMonth = dayStartFromYMD(getStartOfMonth());
            const startOfLastMonth = new Date(startOfThisMonth);
            startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
            const endOfLastMonth = new Date(startOfThisMonth);
            endOfLastMonth.setDate(0);
            endOfLastMonth.setHours(23, 59, 59, 999);
            startOfLastMonth.setHours(0, 0, 0, 0);
            return { start: startOfLastMonth, end: endOfLastMonth };
        }
        case 'năm này': {
            const startOfThisYear = dayStartFromYMD(getStartOfYear());
            const startOfLastYear = new Date(startOfThisYear);
            startOfLastYear.setFullYear(startOfLastYear.getFullYear() - 1);
            const endOfLastYear = new Date(startOfThisYear);
            endOfLastYear.setTime(startOfThisYear.getTime() - 1);
            startOfLastYear.setHours(0, 0, 0, 0);
            return { start: startOfLastYear, end: endOfLastYear };
        }
        default:
            return null;
    }
}

function buildDateQuery(reqQuery) {
    const { date, startDate, endDate } = reqQuery;
    const query = {};

    if (date) {
        switch (date) {
            case 'hôm nay': {
                const r = getDateRange('today');
                query.createdAt = { $gte: r.start, $lte: r.end };
                break;
            }
            case 'hôm qua': {
                const r = getDateRange('yesterday');
                query.createdAt = { $gte: r.start, $lte: r.end };
                break;
            }
            case 'tuần này':
                query.createdAt = {
                    $gte: dayStartFromYMD(getStartOfWeek()),
                    $lte: dayEndFromYMD(getEndOfWeek()),
                };
                break;
            case 'tháng này':
                query.createdAt = {
                    $gte: dayStartFromYMD(getStartOfMonth()),
                    $lte: dayEndFromYMD(getEndOfMonth()),
                };
                break;
            case 'năm này':
                query.createdAt = {
                    $gte: dayStartFromYMD(getStartOfYear()),
                    $lte: dayEndFromYMD(getEndOfYear()),
                };
                break;
            default:
                break;
        }
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

    return query;
}

function calcPercentChange(current, previous) {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
}

const WAREHOUSE_REPORT_LIMIT = 400;
const TOP_LIMIT = 5;

class ReportController {
    /** [GET] /report */
    async index(req, res, next) {
        try {
            const { category } = req.query;
            const query = buildDateQuery(req.query);

            const orders = await Order.find(query).lean();
            const orderSuccess = orders.filter((order) => order.status === 'Thành công');
            const orderFalse = orders.filter((order) => order.status === 'Thất bại');
            const totalRevenue = orderSuccess.reduce((acc, item) => acc + item.total_price, 0);
            const totalProductsSold = await DetailOrder.aggregate([
                { $match: { order_id: { $in: orderSuccess.map((o) => o._id) } } },
                { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } },
            ]);
            const productsSoldCount = totalProductsSold[0]?.totalQuantity || 0;

            let prevRevenue = 0;
            let prevProductsSold = 0;
            let prevTotalOrder = 0;
            let prevTotalOrderFalse = 0;

            const { date } = req.query;
            if (date) {
                const prevPeriod = getPreviousPeriod(date);
                if (prevPeriod && prevPeriod.start && prevPeriod.end) {
                    const prevQuery = {
                        createdAt: {
                            $gte: prevPeriod.start,
                            $lte: prevPeriod.end,
                        },
                    };
                    const prevOrders = await Order.find(prevQuery).lean();
                    const prevOrderSuccess = prevOrders.filter((o) => o.status === 'Thành công');
                    const prevOrderFalse = prevOrders.filter((o) => o.status === 'Thất bại');
                    prevRevenue = prevOrderSuccess.reduce((acc, item) => acc + item.total_price, 0);
                    prevTotalOrder = prevOrders.length;
                    prevTotalOrderFalse = prevOrderFalse.length;
                    const prevProductsSoldAgg = await DetailOrder.aggregate([
                        { $match: { order_id: { $in: prevOrderSuccess.map((o) => o._id) } } },
                        { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } },
                    ]);
                    prevProductsSold = prevProductsSoldAgg[0]?.totalQuantity || 0;
                }
            }

            const revenueChange = calcPercentChange(totalRevenue, prevRevenue);
            const productSoldChange = calcPercentChange(productsSoldCount, prevProductsSold);
            const totalOrderChange = calcPercentChange(orders.length, prevTotalOrder);
            const orderFalseChange = calcPercentChange(orderFalse.length, prevTotalOrderFalse);

            const successfulOrderIds = orderSuccess.map((o) => o._id);

            const categoryMatch =
                category && mongoose.isValidObjectId(category)
                    ? { $eq: ['$product.category', new mongoose.Types.ObjectId(category)] }
                    : true;

            const pipeline = [
                { $match: { order_id: { $in: successfulOrderIds } } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product_id',
                        foreignField: '_id',
                        as: 'product',
                    },
                },
                { $unwind: '$product' },
            ];

            if (category && mongoose.isValidObjectId(category)) {
                const catId = new mongoose.Types.ObjectId(category);
                pipeline.push({ $match: { 'product.category': catId } });
            }

            pipeline.push(
                {
                    $group: {
                        _id: '$product.category',
                        totalQuantity: { $sum: '$quantity' },
                    },
                },
                {
                    $lookup: {
                        from: 'categoryproducts',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                { $unwind: '$category' },
                {
                    $project: {
                        _id: 0,
                        name: '$category.name',
                        value: '$totalQuantity',
                    },
                }
            );

            const result = await DetailOrder.aggregate(pipeline);

            const spendingByUser = {};
            orderSuccess.forEach((order) => {
                const userId = order.user_id.toString();
                spendingByUser[userId] = (spendingByUser[userId] || 0) + order.total_price;
            });

            const topUserIdsSorted = Object.entries(spendingByUser)
                .sort((a, b) => b[1] - a[1])
                .slice(0, TOP_LIMIT);

            const topUserIds = topUserIdsSorted.map(([userId]) => userId);
            const topUsers = await User.find({ _id: { $in: topUserIds } }).lean();

            const topSpenders = topUsers.map((user) => ({
                ...user,
                totalSpent: spendingByUser[user._id.toString()],
            }));
            topSpenders.sort((a, b) => b.totalSpent - a.totalSpent);

            const orderIds = orderSuccess.map((order) => order._id);
            const topSellingProducts = await DetailOrder.aggregate([
                {
                    $match: {
                        order_id: { $in: orderIds },
                    },
                },
                {
                    $group: {
                        _id: '$product_id',
                        totalSold: { $sum: '$quantity' },
                    },
                },
                { $sort: { totalSold: -1 } },
                { $limit: TOP_LIMIT },
            ]);

            const productIds = topSellingProducts.map((p) => p._id);
            const productInfo = await Product.find({ _id: { $in: productIds } }).lean();

            const productMap = {};
            topSellingProducts.forEach((p) => {
                productMap[p._id.toString()] = p.totalSold;
            });
            const productTren = productInfo.map((p) => ({
                ...p,
                totalSold: productMap[p._id.toString()] || 0,
            }));

            productTren.sort((a, b) => b.totalSold - a.totalSold);

            const comments = await Comment.aggregate([
                {
                    $group: {
                        _id: '$star',
                        total: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            const colors = ['#2B7FFF', '#DBEAFE', '#F59E0B', '#10B981', '#EF4444', '#6366F1'];
            const column = [1, 2, 3, 4, 5].map((star, idx) => ({
                name: `${star} sao`,
                color: colors[idx],
            }));

            const chartData = [
                [1, 2, 3, 4, 5].reduce((acc, star) => {
                    const item = comments.find((r) => Number(r._id) === star);
                    acc.day = 'Đánh giá';
                    acc[`${star} sao`] = item ? item.total : 0;
                    return acc;
                }, {}),
            ];

            const warehouses = await Warehouse.find()
                .populate({
                    path: 'productId',
                    populate: [{ path: 'category' }, { path: 'supplier' }],
                })
                .sort({ stock: 1 })
                .limit(WAREHOUSE_REPORT_LIMIT)
                .lean();

            res.status(200).json({
                warehouses,
                formatComment: chartData,
                columnComment: column,
                productTren,
                dataCategoryChart: result,
                summary: [
                    {
                        name: 'Tổng đơn hàng',
                        count: orders.length,
                        change: totalOrderChange.toFixed(1),
                    },
                    {
                        name: 'Tổng doanh thu',
                        count: totalRevenue,
                        change: revenueChange.toFixed(1),
                    },
                    {
                        name: 'Đơn hàng thất bại',
                        count: orderFalse.length,
                        change: orderFalseChange.toFixed(1),
                    },
                    {
                        name: 'Số lượng sản phẩm đã bán',
                        count: productsSoldCount,
                        change: productSoldChange.toFixed(1),
                    },
                ],
                topSpenders,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [GET] /report/week */
    getRevenueByDate = async (req, res) => {
        try {
            const end = moment().endOf('day').toDate();
            const start = moment().subtract(6, 'days').startOf('day').toDate();

            const orders = await Order.find({
                status: 'Thành công',
                order_date: {
                    $gte: start,
                    $lte: end,
                },
            }).lean();

            const revenueMap = {};

            for (let i = 6; i >= 0; i--) {
                const date = moment().subtract(i, 'days').format('DD/MM');
                revenueMap[date] = 0;
            }

            orders.forEach((order) => {
                const dateKey = moment(order.order_date).format('DD/MM');
                if (revenueMap[dateKey] !== undefined) {
                    revenueMap[dateKey] += order.total_price;
                }
            });

            const chartResult = Object.keys(revenueMap).map((d) => ({
                date: d,
                revenue: revenueMap[d],
                target: 1000,
            }));

            res.status(200).json({
                result: chartResult,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Lỗi server' });
        }
    };
}

module.exports = new ReportController();
