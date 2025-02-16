const User = require('../model/user.model');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util')
const { mongooseToObject } = require('../../util/mongoose.util')
const { importDate } = require('../../util/importDate.util');
const moment = require('moment');
const mongoose = require('mongoose');
const Product = require('../model/products.model');
const Cart = require('../model/cart.model');
class UserController {
    
    /** [GET] /users */
    async index(req, res, next) {
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let skip = (page - 1) * limit;
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
                return res.render('user/user', {
                    searchType: true,
                    searchUser: userFormart,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                })
            }
            const users = await User.find()
                .skip(skip)
                .limit(limit)
                .sort({ [sortField]: sortOrder }) // Sắp xếp sản phẩm
                .lean();
    
            const formatUser = users.map(user => ({
                ...user,
                birthFormat: formatDate(user.birth),
                lastLoginFormat: formatDate(user.lastLogin),
            }));
    
            const totalUser = await User.countDocuments();
            const totalPage = Math.ceil(totalUser / limit);
    
            res.render('user/user', {
                formatUser,
                currentPage: page,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            });
        }catch(err){
            next(err)
        }
    }
 
    /** [GET] /users/add */
    add(req, res, next){
        res.render('user/addUser');
    }

    /** [POST] /users/store */
    store = async(req, res, next) => {
        try{
            const {
                account,
                password,
                avatar,
                name,
                address,
                phone,
                email,
                birth,
                authour
            } = req.body;
            const user = new User({
                account,
                password,
                avatar,
                name,
                address,
                phone,
                email,
                birth,
                authour
            })
            await user.save();
            res.redirect('/users');
        }catch(error){
            next(error);
        }
    }

    /** [GET] /users/:id/edit */
    edit(req, res, next) {
        User.findById(req.params.id)
        .then(user => {
            const formatBirth = {
                    ...user.toObject(),
                    birthFormated: importDate(user.birth)
            }
            res.render('user/editUser', {
                user: formatBirth
            })
        })
    }

    /** [PUT] /users/:id */
    update(req, res, next) {
        User.findById(req.params.id)
            .then(user => {
                if (!user) {
                    return res.status(404).send('users not found');
                }
                if (user.account === req.body.account) {
                    delete req.body.account;
                }
                return User.updateOne({ _id: req.params.id }, { $set: req.body });
            })
            .then(() => {
                res.redirect('/users')
            })
            .catch(next)
    }

    /** [DELETE] /users/:id */
    delete(req, res, next) {
        User.deleteOne({_id: req.params.id})
        .then(() => {
            res.redirect('back');
        })
        .catch(error => {
            next(error);
        });
    }

    /** [GET] /user/api/count */
    getCustomersLast7Days = async (req, res) => {
        try {
            const sevenDaysAgo = moment().subtract(7, "days").startOf("day").toDate();
            const today = moment().endOf("day").toDate();
    
            const customers = await User.aggregate([
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
                            day: { $dayOfMonth: "$createdAt" }
                        },
                        count: { $sum: 1 } 
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }// 1 tăng, -1 là giảm
                } 
            ]);
            res.json(customers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi server" });
        }
    }
    
    /** [GET] /users/cart/:id */
    async getCart(req, res, next) {
        try {
            const userId = req.params.id;
    
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "User không hợp lệ" });
            }
    
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: "User không tồn tại" });
            }
    
            const products = await Product.find({});
    
            const cart = await Cart.findOne({ userId });
    
            if (!cart) {
                return res.render('user/cartUser', {
                    cart: null,
                    itemsWithProductDetails: [],
                    user: user.toObject(),
                    products: mutipleMongooseoObject(products)
                });
            }
    
            const itemsWithProductDetails = await Promise.all(cart.items.map(async (item) => {
                const product = await Product.findById(item.productId);
                return {
                    productId: item.productId,
                    name: product ? product.name : "Sản phẩm không tồn tại",
                    img: product ? product.thumbnail_main : "/images/default.jpg",
                    price: product ? product.price : 0,
                    quantity: item.quantity
                };
            }));
    
            res.render('user/cartUser', {
                cart: cart.toObject(),
                itemsWithProductDetails, 
                user: user.toObject(),
                products: mutipleMongooseoObject(products)
            });
    
        } catch (err) {
            console.error("Lỗi khi lấy giỏ hàng:", err);
            next(err);
        }
    }

    /** [GET] /users/cart/:id/add */
    async addCartUser(req, res, next) {
        try{
            const userId = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "User không hợp lệ" });
            }

            const user = await User.findById(userId);

            const products = await Product.find();

            res.render('user/cartUserAdd', {
                user: mongooseToObject(user),
                products: mutipleMongooseoObject(products)
            })
        }catch(err){
            next(err);
        }
    }

    /** [POST] /users/cart/:id/store */
    async storeCart(req, res, next) {
        try {
            let { userId, items } = req.body;

            if (!userId || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: "Dữ liệu không hợp lệ." });
            }

            items = items.map((item, index) => ({
                productId: item.productId ? item.productId.trim() : null,
                price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 1
            })).filter(item => item.productId); 

            let cart = await Cart.findOne({ userId });

            if (cart) {
                items.forEach(newItem => {
                    const existingItem = cart.items.find(item => item.productId.equals(newItem.productId));

                    if (existingItem) {
                        existingItem.quantity += newItem.quantity;
                    } else {
                        cart.items.push(newItem);
                    }
                });
            } else {
                cart = new Cart({ userId, items });
            }

            cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            await cart.save();

            res.redirect('/users')

        } catch (err) {
            console.error("Lỗi khi lưu giỏ hàng:", err);
            res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
            next(err);
        }
    }
    

    /** [GET] /users/cart/infor/:id */
    async getCartInfor(req, res, next) {
        try{
            const userId = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "User không hợp lệ" });
            }
            const cart = await Cart.findOne({userId: userId});

            const itemsWithProductDetails = await Promise.all(cart.items.map(async (item) => {
                const product = await Product.findById(item.productId); 
                return {
                    productId: item.productId,
                    name: product.name,
                    img: product.thumbnail_main,
                    price: product.price,
                    quantity: item.quantity
                };
            }));
            
            res.json({
                cart,
                itemsWithProductDetails
            });
        }catch(err) {
            next(err);
        }
    }
}

module.exports = new UserController();