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
                    message: "Có đơn hàng mới từ tài khoản: " + userNotificaiton.account + ", với mã đơn hàng: order_code",
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
                    const category = product ? await CategoryProduct.findById(product.category) : null;
                    return {
                        ...details.toObject(),
                        name: product ? product.name : 'Unknown',
                        price: product ? product.price : 'Unknown',
                        thumbnail_main: product ? product.thumbnail_main : 'Unknown',
                        shipping_cost: product ? product.shipping_cost : 0,
                        category: category ? category.name : 'Unknown',
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
        try{
            const sevenDaysAgo = moment().subtract(7, 'days').startOf('day').toDate();
            const today = moment().endOf('day').toDate();
            const order = await Orders.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo, $lte: today } 
                    }
                },{
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            day: { $dayOfMonth: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },{
                    $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
                }
            ])
            res.json(order);
        }catch(err) {   
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
    
}

module.exports = new OdersController();