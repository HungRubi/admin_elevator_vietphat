const Order = require("../model/orders.model");
const Warranty = require('../model/warranty.model');
const OrderDetail = require("../model/orderDetail.model");
const { formatDate } = require("../../util/formatDate.util");
const { importDate } = require("../../util/importDate.util");
const { v4: uuidv4 } = require('uuid');
const User = require("../model/user.model");
const Notification = require("../model/notification.model");
const WareHouse = require("../model/warehouse.model");
class WarrantyController {

    /** [GET] /warranty */
    async index (req, res) {
        let sortField = req.query.sort || 'updatedAt'; 
        let sortWarranty = req.query.warranty === 'desc' ? 1 : -1;
        try {
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery) {
                const warranties = await Warranty
                .find({
                    $or: [
                        { code: new RegExp(searchQuery || '', 'i') },
                    ],
                })
                .populate({
                    path: 'product_id',
                    populate: {path: 'category'},
                })
                .populate('user_id')
                .populate('order_code')
                .sort({ [sortField]: sortWarranty })
                .lean();
                const formatWarranties = warranties.map((warranty) => ({
                    ...warranty,
                    purchaseDate: formatDate(warranty.purchase_date),
                    warrantyDate: formatDate(warranty.warranty_date),
                    createTime: formatDate(warranty.createdAt),
                }));
                return res.status(200).json({
                    searchType: true,
                    searchWarranty: formatWarranties,
                    currentSort: sortField,
                    currentWarranty: sortWarranty === 1 ? 'asc' : 'desc',
                });
            }
            const warranties = await Warranty
            .find()
            .populate({
                path: 'product_id',
                populate: {path: 'category'},
            })
            .populate('user_id')
            .populate('order_code')
            .sort({ [sortField]: sortWarranty })
            .lean();
            const formatWarranties = warranties.map((warranty) => ({
                ...warranty,
                purchaseDate: formatDate(warranty.purchase_date),
                warrantyDate: formatDate(warranty.warranty_date),
                createTime: formatDate(warranty.createdAt),
            }));

            const totalWarranties = await Warranty.countDocuments();
            const totalPage = Math.ceil(totalWarranties / 10);
            return res.status(200).json({
                searchType: false,
                warranties: formatWarranties,
                currentSort: sortField,
                currentWarranty: sortWarranty === 1 ? 'asc' : 'desc',
                totalPage,
            });
        } catch (error) {
            console.error('Error fetching warranty data:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /** [GET] /warranty/add */
    async add (req, res) {
        try{
            const orders = await Order
            .find({status: "Thành công"})
            .populate("user_id")
            .sort({ createdAt: -1 })
            .lean();
            const orderFormat = await Promise.all(
                orders.map(async (order) => {
                    const orderDetail = await OrderDetail
                    .find({ order_id: order._id })
                    .populate({
                        path: "product_id",
                        populate: {
                            path: "category"
                        }
                    })
                    return {
                        ...order,
                        orderDetail,
                        orderDate: importDate(order.order_date)
                    }
                })
            )
            res.status(200).json({
                orders: orderFormat,
            })
        }catch(error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

    /** [POST] /warranty/store */
    async store (req, res) {
        try{
            const { 
                order_code, 
                user_id, 
                address, 
                products, 
                purchase_date, 
                warranty_date,
                description,
                video,
                status,
            } = req.body;
            products.forEach(async (item) => {
                const code = uuidv4();
                const warranty = new Warranty({
                    code,
                    order_code, 
                    user_id, 
                    address,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    purchase_date, 
                    warranty_date,
                    description,
                    video,
                    status,
                })
                await warranty.save();
            })

            const userAdmin = await User.find({authour: "admin"})
            userAdmin.forEach(async (user) => {
                const notifi = new Notification({
                    type: "Thông báo hệ thống",
                    message: `${products.length} phiếu bảo hành mới đã được tạo cho đơn hàng ${order_code}`,
                    user_id: user._id
                })
                await notifi.save();
            })
            for (const i of products) {
                await WareHouse.findOneAndUpdate(
                    { productId: i.product_id },
                    { $inc: { stock: -i.quantity } },
                    { upsert: true, new: true }
                );
            }
            res.status(200).json({
                message: "Thêm phiếu bảo hành thành công"
            })
        }catch(error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

    /** [GET] /warranty/:id */
    async detail (req, res) {
        try{
            const { id } = req.params;
            const warranty = await Warranty
            .findById(id)
            .populate("user_id")
            .populate("order_code")
            .populate({
                path: 'product_id',
                populate: { path: 'category' }
            })
            .lean();
            if (!warranty) {
                return res.status(404).json({
                    message: "Không tìm thấy phiếu bảo hành"
                });
            }
            const formatWarranty = {
                ...warranty,
                purchaseDate: importDate(warranty.purchase_date),
                warrantyDate: importDate(warranty.warranty_date),
            };
            res.status(200).json({
                warranty: formatWarranty
            });
        }catch(error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

    /** [PUT] /warranty/:id */
    async update (req, res) {
        try{
            const {
                order_code,
                user_id,
                address,
                products,
                description,
                video,
                purchase_date,
                warranty_date,
                status,
            } = req.body;
            const warranty ={
                order_code,
                user_id,
                address,
                product_id: products._id,
                quantity: products.quantity,
                description,
                video,
                purchase_date,
                warranty_date,
                status,
            };
            const { id } = req.params;
            const warrantyInit = await Warranty.findById(id);
            await Warranty.findByIdAndUpdate(id, warranty, { new: true });
            const userAdmin = await User.find({authour: "admin"})
            userAdmin.forEach(async (user) => {
                const notifi = new Notification({
                    type: "Thông báo hệ thống",
                    message: `Phiếu bảo hành ${warranty.code} đã được cập nhật`,
                    user_id: user._id
                })
                await notifi.save();
            })
            const quantityDifference = products.quantity - warrantyInit.quantity;
            await WareHouse.findOneAndUpdate(
                { productId: products._id },
                { $inc: { stock: -quantityDifference } },
                { upsert: true, new: true }
            );
            res.status(200).json({
                message: "Cập nhật phiếu bảo hành thành công"
            });
        }catch(error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

    /** [DELETE] /warranty/:id */
    async delete (req, res) {
        try{
            const { id } = req.params;
            const warranty = await Warranty.findById(id);
            if (!warranty) {
                return res.status(404).json({
                    message: "Không tìm thấy phiếu bảo hành"
                });
            }
            await Warranty.findByIdAndDelete(id);
            const userAdmin = await User.find({authour: "admin"})
            userAdmin.forEach(async (user) => {
                const notifi = new Notification({
                    type: "Thông báo hệ thống",
                    message: `Phiếu bảo hành ${warranty.code} đã bị xóa`,
                    user_id: user._id
                })
                await notifi.save();
            })
            const notifi = new Notification({
                type: "Thông báo hệ thống",
                message: `Phiếu bảo hành ${warranty.code} đã bị xóa`,
                user_id: warranty.user_id
            })
            await notifi.save();
            await WareHouse.findOneAndUpdate(
                { productId: warranty.product_id },
                { $inc: { stock: warranty.quantity } },
                { upsert: true, new: true }
            );
            res.status(200).json({
                message: "Xóa phiếu bảo hành thành công"
            });
        }catch(error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

    /** [GET] /warranty/filter */
    async filterWarranty(req, res) {
        try {
            console.log(req.query)
            const { status, startDate, endDate } = req.query;
            let query = {};
            if (status) {
                query.status = status;
            }
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); 

                query.createdAt = {
                    $gte: start,
                    $lte: end
                };
            }
            const warranties = await Warranty
                .find(query)
                .populate('user_id')
                .populate({ 
                    path: 'product_id',
                    populate: { path: 'category' }
                })
                .populate('order_code')
                .lean();
            const formatWarranties = warranties.map((warranty) => ({
                ...warranty,
                purchaseDate: formatDate(warranty.purchase_date),
                warrantyDate: formatDate(warranty.warranty_date),
                createTime: formatDate(warranty.createdAt),
            }));
            res.status(200).json({
                warranties: formatWarranties
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            });
        }
    }

}

module.exports = new WarrantyController();