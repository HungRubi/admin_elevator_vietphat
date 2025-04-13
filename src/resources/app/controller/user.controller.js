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
        console.log(req.body)
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
}

module.exports = new UserController();