const { mutipleMongooseoObject, mongooseToObject } = require('../../util/mongoose.util');
const User = require('../model/user.model');
const Product = require('../model/products.model');
const Orders = require('../model/orders.model');
const OrderDetail = require('../model/orderDetail.model')
const Discount = require('../model/discount.model');
const CategoryProduct = require('../model/categoryProduct.model')
const Notification = require('../model/notification.model');
const Warehouse = require("../model/warehouse.model");
const {formatDate} = require('../../util/formatDate.util');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
class OdersController {
    
    /** [GET] /order */
    async index(req, res, next) {
        let sortField = req.query.sort || 'createdAt'; 
        let sortOrder = req.query.order === 'desc' ? 1 : -1;
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery){
                const orders = await Orders.find({
                    order_code: { $regex: searchQuery, $options: 'i' }
                }).sort({ [sortField]: sortOrder }).lean();
                const orderFormat = await Promise.all(
                    orders.map(async (order) => {
                        const user = await User.findById(order.user_id);
                        const discount = await Discount.findById(order.discount_id);
                        return {
                            ...order,
                            orderDate: formatDate(order.order_date),
                            lastUpdate: formatDate(order.updatedAt),
                            userName: user ? user.name : 'Unknown',
                            userAvatar: user ? user.avatar : 'Unknown',
                            discountName: discount ? discount.title : 'Unknown'
                        };
                    })
                );
                const data = {
                    searchType: true,
                    searchOrder: orderFormat,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                }
                return res.status(200).json({data})
            }
            const orders = await Orders.find()
                .sort({ [sortField]: sortOrder }) 
                .lean();
    
            const orderFormat = await Promise.all(
                orders.map(async (order) => {
                    const user = await User.findById(order.user_id);
                    const discount = await Discount.findById(order.discount_id);
                    return {
                        ...order,
                        lastUpdate: formatDate(order.updatedAt),
                        orderDate: formatDate(order.order_date),
                        userName: user ? user.name : 'Unknown',
                        userAvatar: user ? user.avatar : 'Unknown', 
                        discountName: discount ? discount.title : 'Người dùng không sử dụng mã giảm giá'
                    };
                })
            );
            const totalOrder = await Orders.countDocuments();
            const totalPage = Math.ceil(totalOrder / 10);
            
            const data = {
                orderFormat,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            }
            res.status(200).json({data});
        }catch(err){
            next(err)
        }
    }
    
    /** [GET] /orders/add */
    async add(req, res, next) {
        try{
            const products = await Product.find().populate('category');
            const users = await User.find({ authour: 'customer' });
            const currentDate = new Date();
            const discounts = await Discount.find({ 
                end_date: { $gt: currentDate }
            });
            const data = {
                products: mutipleMongooseoObject(products),
                discounts: mutipleMongooseoObject(discounts),
                users: mutipleMongooseoObject(users),
            }
            res.status(200).json({data});
        }catch(err){
            next(err);
        }
    }

    /** [POST] /order/store */
    store = async(req, res, next) => {
        try{
            console.log("Body: ", req.body)
            const { user_id, total_price, shipping_address, payment_method, items, status, discount_id } = req.body;

            const order_code = uuidv4();
            const order = new Orders({
                user_id,
                order_code,
                total_price,
                shipping_address,
                payment_method,
                discount_id,
                status
            });
    
            await order.save();
            const orderId = order._id;

            // Create notification for customer
            const admin = await User.find({ authour: { $in: ['admin', 'employee'] } });
            const notificationUser = new Notification({
                user_id: user_id,
                type: "Thông báo đơn hàng",
                message: "Bạn vừa đặt hàng thành công. Mã đơn hàng của bạn là: " + order_code,
                isRead: false
            })
            await notificationUser.save();
            const userNotificaiton = await User.findById(user_id)
            admin.forEach(async (a) => {
                const notificationAdmin = new Notification({
                    user_id: a._id,
                    type: "Thông báo đơn hàng",
                    message: "Có đơn hàng mới từ tài khoản: " + userNotificaiton.account + ", với mã đơn hàng: " + order_code,
                    isRead: false
                });
                await notificationAdmin.save();
            });

            const orderDetail = items.map(product => ({
                order_id: orderId, 
                product_id: product.product_id,
                quantity: product.quantity,
                total_price: product.price
            }));
            for (const i of items) {
                await Warehouse.findOneAndUpdate(
                    { productId: i.product_id },
                    { $inc: { stock: -i.quantity } },
                    { upsert: true, new: true }
                );
            }
            await OrderDetail.insertMany(orderDetail);
            const orders = await Orders.find({ user_id: user_id });
            const orderIds = orders.map(item => item._id);

            // Format ngày tạo
            const formattedOrders = orders.map(order => {
                return {
                    ...order.toObject(),
                    createdAtFormatted: order.createdAt.toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    }),
                };
            });

            const orderDetails = await OrderDetail.find({ order_id: { $in: orderIds } });
            const productIds = orderDetails.map(item => item.product_id);
            const products = await Product.find({ _id: { $in: productIds } });

            // Map nhanh product theo _id
            const productMap = {};
            products.forEach(p => {
                productMap[p._id.toString()] = p;
            });

            // Gắn product vào orderDetail
            const orderDetailsWithProducts = orderDetails.map(detail => {
            const product = productMap[detail.product_id.toString()];
                return {
                    ...detail.toObject(),
                        product,
                    };
            });

            // Nhóm orderDetails theo order_id
            const orderDetailMap = {};
            orderDetailsWithProducts.forEach(detail => {
                const key = detail.order_id.toString();
                if (!orderDetailMap[key]) {
                    orderDetailMap[key] = [];
                }
                orderDetailMap[key].push(detail);
            });

            // Gộp order + orderDetails
            const ordersWithDetails = formattedOrders.map(order => {
                return {
                    ...order,
                    orderDetails: orderDetailMap[order._id.toString()] || [],
                };
            });
            res.status(200).json({
                message: 'Đặt hàng thành công',
                order_code,
                orders: ordersWithDetails,
                orderId
            });
        }catch(err){
            next(err)
        }
    }

    /** [GET] /order/:id */
    async edit(req, res, next) {
        try{
            const orderId = req.params.id;
            const orders = await Orders.findById(orderId);
            const discountId = orders.discount_id;
            const discount = await Discount.findById(discountId);
            const detailsOrder = await OrderDetail.find({order_id: orderId});
            if (!detailsOrder) {
                return res.status(404).send("Order details not found");
            }
            const formatOrder = {
                ...orders.toObject(),
                discountName: discount ? discount.title : "Unknown"
            };
            const orderDetailsFormat = await Promise.all(
                detailsOrder.map(async (details) => {
                    const product = await Product.findById(details.product_id);
                    const discount = await Discount.findById(details.discount_id);
                    const category = product ? await CategoryProduct.findById(product.category) : null;
                    return {
                        ...details.toObject(),
                        name: product ? product.name : 'Unknown',
                        price: product ? product.price : 'Unknown',
                        thumbnail_main: product ? product.thumbnail_main : 'Unknown',
                        shipping_cost: product ? product.shipping_cost : 0,
                        category: category ? category.name : 'Unknown',
                        unit: product ? product.unit : 'Unknown',
                        discount: discount ? discount.title : 'Không có mã giảm giá'
                    };
                })
            );
            const data = {
                orderDetailsFormat,
                orders: formatOrder,
                discount: mongooseToObject(discount),
            }
            res.status(200).json({data});
        }catch(err){
            console.error("❌ Error in edit controller:", err);
            res.status(500).json({ error: err.message || "Internal Server Error" });
        }
    }

    /** [PUT] /order/:id/ */
    async update(req, res, next) {
        try{
            await Orders.updateOne({_id: req.params.id}, req.body);
            const orders = await Orders.find({ user_id: req.body.userId });
            const orderIds = orders.map(item => item._id);

            // Format ngày tạo
            const formattedOrders = orders.map(order => {
                return {
                    ...order.toObject(),
                    createdAtFormatted: order.createdAt.toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                };
            });

            const orderDetails = await OrderDetail.find({ order_id: { $in: orderIds } });
            const productIds = orderDetails.map(item => item.product_id);
            const products = await Product.find({ _id: { $in: productIds } });

            // Map nhanh product theo _id
            const productMap = {};
            products.forEach(p => {
                productMap[p._id.toString()] = p;
            });

            // Gắn product vào orderDetail
            const orderDetailsWithProducts = orderDetails.map(detail => {
            const product = productMap[detail.product_id.toString()];
                return {
                    ...detail.toObject(),
                    product,
                };
            });

            // Nhóm orderDetails theo order_id
            const orderDetailMap = {};
            orderDetailsWithProducts.forEach(detail => {
                const key = detail.order_id.toString();
                if (!orderDetailMap[key]) {
                    orderDetailMap[key] = [];
                }
                orderDetailMap[key].push(detail);
            });

            // Gộp order + orderDetails
            const ordersWithDetails = formattedOrders.map(order => {
                return {
                    ...order,
                    orderDetails: orderDetailMap[order._id.toString()] || [],
                };
            });
            res.status(200).json({
                message: 'Hủy đơn hàng thành công',
                orders: ordersWithDetails
            })
        }catch(error){
            console.log(error);
            res.status(500).json({message: "Lỗi hệ thống"});
        }
        
    }

    /** [PUT] /order/admin/:id */
    async updateOrderAdmin(req, res) {
        try{
            await Orders.updateOne({_id: req.params.id}, req.body);
            res.status(200).json({
                message: "cập nhật đơn hàng thành công"
            })
        }catch(error){
            console.log(error);
            res.status(500).json({message: "Lỗi hệ thống"});
        }
    }

    /** [GET] order/details/:id */
    async details(req, res, next){
        const orderId = req.params.id;
        const detailsOrder = await OrderDetail.find({order_id: orderId});
        console.log(detailsOrder)

        if (!detailsOrder) {
            return res.status(404).send("Order details not found");
        }

        const orderDetailsFormat = await Promise.all(
            detailsOrder.map(async (details) => {
                const product = await Product.findById(details.product_id);
                return {
                    ...details.toObject(),
                    productName: product ? product.name : 'Unknown',
                    productPrice: product ? product.price : 'Unknown',
                    productImage: product ? product.thumbnail_main : 'Unknown',
                };
            })
        );

        res.render('orders/detailOrder', { orderDetailsFormat });
    }

    /** [GET] /order/api/count  */
    async getOrderLast7Days(req, res, next) {
        try {
            const sevenDaysAgo = moment().subtract(6, 'days').startOf('day').toDate();
            const today = moment().endOf('day').toDate();
            
            const orderData = await Orders.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo, $lte: today }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            day: { $dayOfMonth: "$createdAt" },
                            dayOfWeek: { $dayOfWeek: "$createdAt" }
                        },
                        completed: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Thành công"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        pending: {
                            $sum: {
                                $cond: [
                                    { 
                                        $or: [
                                            { $eq: ["$status", "Đang xử lý"] },
                                            { $eq: ["$status", "Đang giao hàng"] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        failed: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Thất bại"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        total: { $sum: 1 },
                        totalRevenue: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Thành công"] },
                                    "$total_price",
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
                }
            ]);

            // Tạo array các ngày trong tuần
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            // Tạo array 7 ngày với data mặc định
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = moment().subtract(i, 'days');
                const dayName = daysOfWeek[date.day()];
                
                // Tìm data cho ngày này
                const dayData = orderData.find(item => 
                    item._id.year === date.year() &&
                    item._id.month === date.month() + 1 &&
                    item._id.day === date.date()
                );

                last7Days.push({
                    day: dayName,
                    completed: dayData ? dayData.completed : 0,
                    pending: dayData ? dayData.pending : 0,
                    failed: dayData ? dayData.failed : 0,
                    total: dayData ? dayData.total : 0,
                    revenue: dayData ? dayData.totalRevenue : 0
                });
            }

            // Tính tổng và phần trăm
            const totalOrders = last7Days.reduce((sum, day) => sum + day.total, 0);
            const totalCompleted = last7Days.reduce((sum, day) => sum + day.completed, 0);
            const totalPending = last7Days.reduce((sum, day) => sum + day.pending, 0);
            const totalFailed = last7Days.reduce((sum, day) => sum + day.failed, 0);
            const totalRevenue = last7Days.reduce((sum, day) => sum + day.revenue, 0);
            
            const completedPercent = totalOrders > 0 ? Math.round((totalCompleted / totalOrders) * 100) : 0;
            const pendingPercent = totalOrders > 0 ? Math.round((totalPending / totalOrders) * 100) : 0;
            const failedPercent = totalOrders > 0 ? Math.round((totalFailed / totalOrders) * 100) : 0;

            // So sánh với tuần trước để tính % thay đổi
            const previousWeekStart = moment().subtract(13, 'days').startOf('day').toDate();
            const previousWeekEnd = moment().subtract(7, 'days').endOf('day').toDate();
            
            const previousWeekOrders = await Orders.countDocuments({
                createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd }
            });

            const changePercent = previousWeekOrders > 0 
                ? ((totalOrders - previousWeekOrders) / previousWeekOrders * 100).toFixed(1)
                : 0;

            res.status(200).json({
                success: true,
                data: last7Days,
                summary: {
                    totalOrders,
                    totalCompleted,
                    totalPending,
                    totalFailed,
                    totalRevenue,
                    completedPercent,
                    pendingPercent,
                    failedPercent,
                    changePercent: parseFloat(changePercent),
                    changeDirection: changePercent > 0 ? 'increase' : 'decrease'
                }
            });
        } catch (err) {
            next(err);
        }
    }

    /** [DELETE] /orders/details/:id/ */
    async deleteDetails(req, res, next) {
        try{
            console.log(req.params.id);
            const orderId = req.params.id;
            await Orders.deleteOne({ _id: orderId });
            await OrderDetail.deleteMany({ order_id: orderId })
            const orderDetail = await OrderDetail.find({ order_id: orderId });
            for(const i in orderDetail){
                await Warehouse.findOneAndUpdate(
                    { productId: i.product },
                    { $inc: { stock: -i.quantity } },
                    { upsert: true, new: true }
                );
            }
            res.status(200).json({
                message: 'Xóa đơn hàng thành công',
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: error
            })
        }
    }

    /** [GET] /order/filter */
    async filterOrders(req, res) {
        try {
            console.log(req.query)
            const { status, payment_method, from_date, to_date } = req.query;
            let query = {};
    
            if (status) {
                query.status = status;
            }
    
            if (payment_method) {
                query.payment_method = payment_method;
            }
    
            if (from_date && to_date) {
                query.order_date = {
                    $gte: new Date(from_date),
                    $lte: new Date(to_date),
                };
            }
    
            const orders = await Orders.find(query).sort({createdAt: -1});
            const orderFormat = await Promise.all(
                orders.map(async (order) => {
                    const user = await User.findById(order.user_id);
                    const discount = await Discount.findById(order.discount_id);
                    return {
                        ...order.toObject(),
                        lastUpdate: formatDate(order.updatedAt),
                        orderDate: formatDate(order.order_date),
                        userName: user ? user.name : 'Unknown',
                        userAvatar: user ? user.avatar : 'Unknown', 
                        discountName: discount ? discount.title : 'Unknown'
                    };
                })
            );
            const totalOrder = orderFormat.length;
            const totalPage = Math.ceil(totalOrder / 10);
            res.status(200).json({
                orders: orderFormat,
                totalPage
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng' });
        }
    }

    /** [GET] /order/discount-chart */
    async getOrderDiscount (req, res) {
        try {
            // Lấy các đơn hàng trong 7 ngày qua
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const today = moment().endOf('day').toDate();
            const orders = await Orders.find({
                createdAt: { $gte: sevenDaysAgo, $lte: today },
            }).populate('discount_id');
            console.log(orders)
            let typeCount = {
                'giảm theo phần trăm': 0,
                'giảm theo số tiền cố định': 0,
                'khác': 0
            };

            orders.forEach(order => {
                const discount = order.discount_id;
                if (!discount || !discount.discount_type) {
                    typeCount['khác'] += 1;
                    return;
                }
                if (discount.discount_type === 'giảm theo phần trăm') {
                    typeCount['giảm theo phần trăm'] += 1;
                } else if (discount.discount_type === 'giảm theo số tiền cố định') {
                    typeCount['giảm theo số tiền cố định'] += 1;
                } else {
                    typeCount['khác'] += 1;
                }
            });

            const total = Object.values(typeCount).reduce((sum, val) => sum + val, 0) || 1;

            const data = [
                {
                    name: 'Percentage discount',
                    value: Math.round((typeCount['giảm theo phần trăm'] / total) * 100),
                    color: '#4F7DF2'
                },
                {
                    name: 'Fixed card discount',
                    value: Math.round((typeCount['giảm theo số tiền cố định'] / total) * 100),
                    color: '#93C5FD'
                },
                {
                    name: 'No discount used',
                    value: Math.round((typeCount['khác'] / total) * 100),
                    color: '#1E40AF'
                }
            ];

            res.status(200).json({ data });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng' });
        }
    }
    
    /** [GET] /order/payment-chart */
    async  getOrderDiscountSummary(req, res) {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const payingOrdersCount = await Orders.countDocuments({
                createdAt: { $gte: sevenDaysAgo }, 
                discount_id: { $ne: null }         
            });

            const nonPayingOrdersCount = await Orders.countDocuments({
                createdAt: { $gte: sevenDaysAgo }, 
                discount_id: null                  
            });

            const totalOrders = payingOrdersCount + nonPayingOrdersCount;

            let payingPercentage = 0;
            let nonPayingPercentage = 0;

            if (totalOrders > 0) {
                payingPercentage = Math.round((payingOrdersCount / totalOrders) * 100);
                nonPayingPercentage = Math.round((nonPayingOrdersCount / totalOrders) * 100);
            }

            const data = [
                {
                    name: 'Paying customer',
                    value: payingPercentage,
                    count: payingOrdersCount, 
                    color: '#4F7DF2' 
                },
                {
                    name: 'Non-paying customer',
                    value: nonPayingPercentage,
                    count: nonPayingOrdersCount, 
                    color: '#E5EBF9' 
                }
            ];

            res.status(200).json({ data });

        } catch (error) {
            console.error('Error fetching discount summary:', error);
            res.status(500).json({ message: 'Server error while fetching discount summary data.' });
        }
    }

    /** [GET] /order/monthly-chart */
    async getMonthlyRevenue(req, res) {
        try {
            const endDate = new Date(); // Thời điểm hiện tại (ví dụ: 2025-05-29)
            // Đặt endDate về cuối ngày để bao gồm tất cả các đơn hàng trong ngày hiện tại
            endDate.setHours(23, 59, 59, 999); 

            const startDate = new Date(endDate); // Bắt đầu từ endDate
            startDate.setMonth(endDate.getMonth() - 11); // Lùi lại 11 tháng để có tổng 12 tháng
            startDate.setDate(1); // Đặt ngày về 1 để bắt đầu từ đầu tháng đó
            startDate.setHours(0, 0, 0, 0); // Đặt giờ về 0 để bao gồm toàn bộ ngày đầu tiên của tháng

            const monthlyOrderCounts = {};
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            // Khởi tạo monthlyOrderCounts cho đúng 12 tháng
            let currentMonthIterator = new Date(startDate); // Bắt đầu từ startDate (đầu tháng đầu tiên)
            for (let i = 0; i < 12; i++) {
                const monthKey = `${currentMonthIterator.getFullYear()}-${(currentMonthIterator.getMonth() + 1).toString().padStart(2, '0')}`;
                monthlyOrderCounts[monthKey] = 0;
                
                // Debug: In ra các monthKey được khởi tạo
                // console.log(`Initialized monthKey[${i}]: ${monthKey}`);

                // Di chuyển đến tháng tiếp theo
                currentMonthIterator.setMonth(currentMonthIterator.getMonth() + 1);
                currentMonthIterator.setDate(1); // Đảm bảo luôn ở ngày 1 của tháng mới
            }

            // Debug: Kiểm tra tất cả các key đã khởi tạo và số lượng của chúng
            const initializedKeys = Object.keys(monthlyOrderCounts).sort();
            console.log('Number of Initialized monthlyOrderCounts keys:', initializedKeys.length);
            console.log('Initialized monthlyOrderCounts keys:', initializedKeys);


            // Lấy tất cả các đơn hàng trong khoảng thời gian đã định
            const orders = await Orders.find({
                createdAt: { $gte: startDate, $lte: endDate },
                status: 'Thành công' // Chỉ đếm đơn hàng thành công
            });

            console.log(`Found ${orders.length} successful orders in the query range.`);

            // Đếm số lượng đơn hàng cho mỗi tháng
            orders.forEach(order => {
                const orderMonth = order.createdAt.getMonth() + 1;
                const orderYear = order.createdAt.getFullYear();
                const monthKey = `${orderYear}-${orderMonth.toString().padStart(2, '0')}`;
                
                // Debug: Kiểm tra từng order và monthKey của nó
                // console.log(`Processing Order ID: ${order._id}, CreatedAt: ${order.createdAt.toISOString()}, Calculated MonthKey: ${monthKey}`);

                if (monthlyOrderCounts.hasOwnProperty(monthKey)) {
                    monthlyOrderCounts[monthKey] += 1;
                } else {
                    // Điều này có thể xảy ra nếu một đơn hàng nằm ngoài 12 tháng được khởi tạo
                    // hoặc nếu logic khởi tạo tháng bị sai.
                    console.warn(`Order from monthKey (${monthKey}) not found in initialized counts. This order might be outside the 12-month window: ${order._id}`);
                }
            });

            // Chuyển đổi dữ liệu sang định dạng mà Recharts mong muốn
            const chartData = Object.keys(monthlyOrderCounts)
                .sort() // Đảm bảo sắp xếp theo thứ tự thời gian
                .map(key => {
                    const [year, monthNum] = key.split('-');
                    const monthAbbr = monthNames[parseInt(monthNum, 10) - 1];
                    return {
                        month: monthAbbr,
                        value: monthlyOrderCounts[key]
                    };
                });
            
            console.log('Final chartData sent to frontend (elements:', chartData.length, '):', chartData);

            res.status(200).json({ data: chartData });

        } catch (error) {
            console.error('Error fetching monthly order count:', error);
            res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu số lượng đơn hàng hàng tháng.' });
        }
    }
}

module.exports = new OdersController();