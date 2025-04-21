const User = require('../model/user.model');
const Orders = require('../model/orders.model');
const OrderDetail = require('../model/orderDetail.model');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util')
const { mongooseToObject } = require('../../util/mongoose.util')
const { importDate } = require('../../util/importDate.util');
const moment = require('moment');
const mongoose = require('mongoose');
const Product = require('../model/products.model');
const Cart = require('../model/cart.model');
const bcrypt = require('bcrypt');
class UserController {
    
    /** [GET] /api/user */
    async getUser(req, res, next) {
        let sortField = req.query.sort || 'name'; 
        let sortOrder = req.query.order === 'desc' ? -1 : 1;
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery){
                const users = await User.find({
                        name: { $regex: searchQuery, $options: 'i' }
                }).sort({ [sortField]: sortOrder }).lean();
                const userFormart = users.map(user => ({
                    ...user,
                    birthFormat: formatDate(user.birth),
                    lastLoginFormat: formatDate(user.lastLogin),
                }));
                const data = {
                    searchType: true,
                    searchUser: userFormart,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                }
                return res.status(200).json({data})

            }
            const users = await User.find()
                .sort({ [sortField]: sortOrder }) // Sắp xếp sản phẩm
                .lean();
    
            const formatUser = users.map(user => ({
                ...user,
                birthFormat: formatDate(user.birth),
                lastLoginFormat: formatDate(user.lastLogin),
            }));
    
            const totalUser = await User.countDocuments();
            const totalPage = Math.ceil(totalUser / 10);
            const data = {
                formatUser,
                totalUser: totalUser,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            }
            return res.status(200).json({data});
        }catch(err){
            next(err)
        }
    }
    
    /** [GET] /api/user/:id */
    async getUserDetail(req, res, next) {
        try{
            const user = await User.findById(req.params.id)
        
            const formatBirth = {
                    ...user.toObject(),
                    birthFormated: importDate(user.birth)
            }
            const data = {
                user: formatBirth
            }
            res.status(200).json({data})
        }
        catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [PUT] /user/update/address/:id */
    async updateAddress(req, res, next) {
        const userId = req.params.id; // hoặc req.body.id nếu bạn truyền từ body
        try {
            const updatedUser = await User.findByIdAndUpdate(
            userId,
                { $set: req.body },
                { new: true } 
            );

            res.status(200).json({
                updatedUser,
                message: 'Cập nhật địa chỉ thành công',
            });
        } catch (err) {
            res.status(500).json({ message: 'Lỗi khi cập nhật địa chỉ', error: err });
        }
    }

    /** [GET] /user/order/:id */
    async getOrder(req, res) {
        try{
            const userId = req.params.id;
            const orders = await Orders.find({ user_id: userId });
            const orderIds = orders.map(item => item._id);

            // Đếm số đơn hàng thất bại
            const failedOrdersCount = orders.filter(o => o.status === 'Thất bại').length;

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
                order: ordersWithDetails
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: error
            })
        }
    }

    /** [POST] /user/store */
    async store (req, res) {
        try{
            console.log(req.body)
            const {name, email, phone, address, birth, account, avatar, password, comfirm_password, authour} = req.body;
            const existingEmail = await User.findOne({email: email});
            if (existingEmail) {
                return res.status(400).json({
                    message: "Email đã được đăng ký rồi"
                });
            }
            const existingAccount = await User.findOne({account: account});
            if (existingAccount) {
                return res.status(400).json({
                    message: "Tài khoản đã được đăng ký rồi"
                });
            }
            if(password !== comfirm_password) {
                return res.status(400).json({
                    message: "Mật khẩu không trùng nhau"
                })
            }
            const finalAvatar = avatar === ''
            ? 'https://www.dropbox.com/scl/fi/896n7adhufqiu2hlt94u5/default.png?rlkey=gk9thmq6u1grzss8o0c3os39f&st=83b9myer&dl=1'
            : avatar;
            const hashPassword = await bcrypt.hash(password, 10);
            const user = new User({
                name, email, phone, address, birth, account, avatar: finalAvatar, password: hashPassword, authour
            })
            await user.save();
            res.status(200).json({
                message: "Thêm user thành công"
            })
        }catch(error) {
            console.log(error);
            res.status(404).json({
                message: error
            })
        }
    }
}

module.exports = new UserController();