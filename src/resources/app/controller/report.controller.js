const Order = require("../model/orders.model");
const DetailOrder = require("../model/orderDetail.model");
const {getToday, getYesterday, getStartOfWeek, getStartOfMonth, getStartOfYear, getEndOfMonth, getEndOfYear, getEndOfWeek} = require("../../util/formatTime.util");
const moment = require("moment");
const User = require("../model/user.model");    
const Product = require("../model/products.model"); 
const Comment = require("../model/comments.model");
const Warehouse = require("../model/warehouse.model");
class ReportController {

    /** [GET] /report*/
    async index(req, res, next) {
        try {
            const {date, startDate, endDate, category} = req.query;
            
            // Hàm phụ để lấy khoảng thời gian kỳ trước dựa trên kỳ hiện tại
            function getPreviousPeriod(date) {
                switch(date) {
                    case "hôm nay": {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        return { start: yesterday, end: yesterday };
                    }
                    case "hôm qua": {
                        const twoDaysAgo = new Date();
                        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                        return { start: twoDaysAgo, end: twoDaysAgo };
                    }
                    case "tuần này": {
                        const startOfThisWeek = new Date(getStartOfWeek());
                        const startOfLastWeek = new Date(startOfThisWeek);
                        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
                        const endOfLastWeek = new Date(startOfThisWeek);
                        endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
                        return { start: startOfLastWeek, end: endOfLastWeek };
                    }
                    case "tháng này": {
                        const startOfThisMonth = new Date(getStartOfMonth());
                        const startOfLastMonth = new Date(startOfThisMonth);
                        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
                        const endOfLastMonth = new Date(startOfThisMonth);
                        endOfLastMonth.setDate(0); // ngày cuối tháng trước
                        return { start: startOfLastMonth, end: endOfLastMonth };
                    }
                    case "năm này": {
                        const startOfThisYear = new Date(getStartOfYear());
                        const startOfLastYear = new Date(startOfThisYear);
                        startOfLastYear.setFullYear(startOfLastYear.getFullYear() - 1);
                        const endOfLastYear = new Date(startOfThisYear);
                        endOfLastYear.setDate(0);
                        endOfLastYear.setMonth(11); // tháng 12
                        return { start: startOfLastYear, end: endOfLastYear };
                    }
                    default: return null;
                }
            }

            // Hàm formatDate nếu cần convert về string hoặc Date object dùng trực tiếp
            function toDateObj(dateStr) {
                return new Date(dateStr);
            }

            // Tạo query cho kỳ này
            let query = {};
            if(date) {
                switch(date){
                    case "hôm nay":
                        query.createdAt = getToday();
                        break;
                    case "hôm qua":
                        query.createdAt = getYesterday();
                        break;
                    case "tuần này":
                        query.createdAt = {
                            $gte: getStartOfWeek(),
                            $lte: getEndOfWeek(),
                        };
                        break;
                    case "tháng này":
                        query.createdAt = {
                            $gte: getStartOfMonth(),
                            $lte: getEndOfMonth()
                        };
                        break;
                    case "năm này":
                        query.createdAt = {
                            $gte: getStartOfYear(),
                            $lte: getEndOfYear()
                        };
                        break;
                }
            }
            console.log(query)
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt = {
                    $gte: start,
                    $lte: end
                };
            }

            // Lấy dữ liệu kỳ này
            const orders = await Order.find(query).lean();
            const orderSuccess = orders.filter(order => order.status === "Thành công");
            const orderFalse = orders.filter(order => order.status === "Thất bại")
            const totalRevenue = orderSuccess.reduce((acc, item) => acc + item.total_price, 0);
            const totalProductsSold = await DetailOrder.aggregate([
                { $match: { order_id: { $in: orderSuccess.map(o => o._id) } } },
                { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }
            ]);
            const productsSoldCount = totalProductsSold[0]?.totalQuantity || 0;

            // Lấy dữ liệu kỳ trước
            let prevRevenue = 0;
            let prevProductsSold = 0;
            let prevTotalOrder = 0;
            let prevTotalOrderFasle = 0;

            if(date) {
                const prevPeriod = getPreviousPeriod(date);
                if(prevPeriod) {
                    const prevQuery = {
                        createdAt: {
                            $gte: prevPeriod.start,
                            $lte: prevPeriod.end
                        }
                    };
                    const prevOrders = await Order.find(prevQuery).lean();
                    const prevOrderSuccess = prevOrders.filter(order => order.status === "Thành công");
                    const prevOrderFasle = prevOrders.filter(order => order.status === "Thất bại");
                    prevRevenue = prevOrderSuccess.reduce((acc, item) => acc + item.total_price, 0);
                    prevTotalOrder = prevOrders.length;
                    prevTotalOrderFasle = prevOrderFasle.length;
                    const prevProductsSoldAgg = await DetailOrder.aggregate([
                        { $match: { order_id: { $in: prevOrderSuccess.map(o => o._id) } } },
                        { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }
                    ]);
                    prevProductsSold = prevProductsSoldAgg[0]?.totalQuantity || 0;
                }
            }

            // Hàm tính phần trăm thay đổi
            function calcPercentChange(current, previous) {
                if(previous === 0) return current === 0 ? 0 : 100;
                return ((current - previous) / previous) * 100;
            }

            const revenueChange = calcPercentChange(totalRevenue, prevRevenue);
            const productSoldChange = calcPercentChange(productsSoldCount, prevProductsSold);
            const totalOrderChange = calcPercentChange(orders.length, prevTotalOrder);
            const orderFalseChange = calcPercentChange(orderFalse.length, prevTotalOrderFasle)


            const successfulOrderIds = orderSuccess.map(o => o._id);

            const result = await DetailOrder.aggregate([
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
                },
            ]);

            const spendingByUser = {};

            orderSuccess.forEach(order => {
                const userId = order.user_id.toString();
                spendingByUser[userId] = (spendingByUser[userId] || 0) + order.total_price;
            });

            const topUserIdsSorted = Object.entries(spendingByUser)
            .sort((a, b) => b[1] - a[1]) // sort theo total_price giảm dần
            .slice(0, 5); // lấy top 5

            const topUserIds = topUserIdsSorted.map(([userId]) => userId);
            const topUsers = await User.find({ _id: { $in: topUserIds } }).lean();

            const topSpenders = topUsers.map(user => ({
                ...user,
                totalSpent: spendingByUser[user._id.toString()]
            }));
            topSpenders.sort((a, b) => b.totalSpent - a.totalSpent);

            const orderIds = orderSuccess.map(order => order._id);
            const topSellingProducts = await DetailOrder.aggregate([
                {
                    $match: {
                    order_id: { $in: orderIds },
                    },
                },
                {
                    $group: {
                    _id: "$product_id",
                    totalSold: { $sum: "$quantity" },
                    },
                },
                {
                    $sort: { totalSold: -1 }, // Sắp xếp giảm dần
                },
                {
                    $limit: 5, // Lấy top 5
                },
            ]);

            const productIds = topSellingProducts.map(p => p._id);
            const productInfo = await Product.find({ _id: { $in: productIds } }).lean();

            const productMap = {};
            topSellingProducts.forEach(p => {
                productMap[p._id.toString()] = p.totalSold;
            });
            const productTren = productInfo.map(p => ({
                ...p,
                totalSold: productMap[p._id.toString()] || 0
            }));

            productTren.sort((a, b) => b.totalSold - a.totalSold)

            const comments = await Comment.aggregate([
                
                {
                    $group: {
                        _id: '$star',
                        total: {$sum: 1}
                    }
                },{
                    $sort: {_id: 1}
                }
            ]);


            const colors = ['#2B7FFF', '#DBEAFE', '#F59E0B', '#10B981', '#EF4444', '#6366F1'];
            const column = [1, 2, 3, 4, 5].map((star, idx) => ({
                name: `${star} sao`,
                color: colors[idx]
            }));

            // Dữ liệu cho biểu đồ (một object chứa tất cả sao làm field riêng)
            const chartData = [
                [1, 2, 3, 4, 5].reduce((acc, star) => {
                    const item = comments.find(r => r._id === star);
                    acc['day'] = 'Đánh giá'; // hoặc 'Total' hay gì tùy bạn
                    acc[`${star} sao`] = item ? item.total : 0;
                    return acc;
                }, {})
            ];
            const warehouses = await Warehouse
            .find()
            .populate({
                path: 'productId',
                populate: [
                    {path: 'category'},
                    {path: 'supplier'},
                ]
            })
            .sort({ stock: 1 })
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
            })
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            });
        }
    }

    /** [GET] /report/week */
    getRevenueByDate = async (req, res) => {
        try {
            const end = moment().endOf('day').toDate();
            const start = moment().subtract(6, 'days').startOf('day').toDate(); // 7 ngày bao gồm cả hôm nay

            const orders = await Order.find({
                status: 'Thành công',
                order_date: {
                    $gte: start,
                    $lte: end,
                },
            }).lean();

            // Tạo map gom doanh thu theo ngày
            const revenueMap = {};

            // Khởi tạo revenueMap với 7 ngày mặc định (do nếu 1 ngày không có đơn thì vẫn hiển thị)
            for (let i = 6; i >= 0; i--) {
                const date = moment().subtract(i, 'days').format('DD/MM');
                revenueMap[date] = 0;
            }

            // Cộng dồn doanh thu theo ngày
            orders.forEach(order => {
                const dateKey = moment(order.order_date).format('DD/MM');
                if (revenueMap[dateKey] !== undefined) {
                    revenueMap[dateKey] += order.total_price;
                }
            });

            // Chuyển về dạng mảng để trả ra client
            const result = Object.keys(revenueMap).map(date => ({
                date,
                revenue: revenueMap[date],
                target: 1000, // target cố định, có thể tuỳ chỉnh
            }));

            res.status(200).json({
                result
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }; 
}

module.exports = new ReportController();