const { mutipleMongooseoObject, mongooseToObject } = require('../../util/mongoose.util');
const User = require('../model/user.model');
const Product = require('../model/products.model');
const Orders = require('../model/orders.model');
const OrderDetail = require('../model/orderDetail.model')
const Discount = require('../model/discount.model');
const {formatDate} = require('../../util/formatDate.util');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
class OdersController {
    
    /** [GET] /orders */
    async index(req, res, next) {
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let skip = (page - 1) * limit;
        let sortField = req.query.sort || 'order_code'; 
        let sortOrder = req.query.order === 'desc' ? -1 : 1;
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
                            discountName: discount ? discount.title : 'Unknown'
                        };
                    })
                );
                return res.render('orders/orders', {
                    searchType: true,
                    searchOrder: orderFormat,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                })
            }
            const orders = await Orders.find()
                .skip(skip)
                .limit(limit)
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
                        discountName: discount ? discount.title : 'Unknown'
                    };
                })
            );
            const totalOrder = await Orders.countDocuments();
            const totalPage = Math.ceil(totalOrder / limit);
    
            res.render('orders/orders', {
                orderFormat,
                currentPage: page,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            });
        }catch(err){
            next(err);
        }
    }
    
    /** [GET] /orders/add */
    async add(req, res, next) {
        try{
            const products = await Product.find();
            const users = await User.find({ authour: 'customer' });
            const currentDate = new Date();
            const discounts = await Discount.find({ 
                end_date: { $gt: currentDate }
            });
            res.render('orders/addOrder', {
                products: mutipleMongooseoObject(products),
                discounts: mutipleMongooseoObject(discounts),
                users: mutipleMongooseoObject(users),
            });
        }catch(err){
            next(err);
        }
    }

    /** [POST] /orders/store */
    store = async(req, res, next) => {
        try{
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
            const orderDetails = items.map(product => ({
                order_id: orderId, 
                product_id: product.product_id,
                quantity: product.quantity,
                total_price: product.price
            }));
            await OrderDetail.insertMany(orderDetails);
            res.redirect('/orders');
        }catch(err){
            next(err)
        }
    }

    /** [GET] /orders/:id/edit */
    async edit(req, res, next) {
        try{
            const users = await User.find({authour: 'customer'});
            const orderId = req.params.id;
            const orders = await Orders.findById(orderId);
            const discountId = orders.discount_id;
            const discounts = await Discount.find();
            const discount = await Discount.findById(discountId);
            res.render('orders/editOrder',{
                users: mutipleMongooseoObject(users),
                order: mongooseToObject(orders),
                discounts: mutipleMongooseoObject(discounts),
                discount: mongooseToObject(discount),
            });
        }catch(err){
            next(err);
        }
    }

    /** [PUT] /orders/:id/ */
    update(req, res, next) {
        Orders.updateOne({_id: req.params.id}, req.body)
        .then(() => {
            console.log(req.params.id);
            res.redirect('/orders');
        })
        .catch(next);
    }

    

    /** [GET] .orders/details/:id */
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
    deleteDetails(req, res, next) {
        OrderDetail.deleteOne({_id: req.params.id})
        .then(() => {
            res.redirect('/orders')
        })
        .catch(err => {
            next(err);
        })
    }
}

module.exports = new OdersController();