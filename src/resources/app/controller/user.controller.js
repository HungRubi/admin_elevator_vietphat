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
    index(req, res, next) {
        User.find()
        .then(user => {
            const formatUser = user.map(u => {
                return{
                    ...u.toObject(),
                    formatedDate: formatDate(u.lastLogin),
                    formatedBirth: formatDate(u.birth),
                }
            })
            res.render('user/user', {
                user: formatUser,
            });
        })
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
        try{
            const userId = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "User không hợp lệ" });
            }
            const user = await User.findById(userId);

            const products = await Product.find({});

            res.render('user/cartUser', {
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
            const { userId, items, totalPrice } = req.body;
            let cart = await Cart.findOne({ userId });
            if (cart) {
                cart.items = items; 
                cart.totalPrice = totalPrice;
                await cart.save();
            } else {
                cart = new Cart({
                    userId,
                    items,
                    totalPrice
                });
                await cart.save();
            }
            res.redirect('/users');
        } catch (err) {
            next(err);
        }
    }
    
}

module.exports = new UserController();