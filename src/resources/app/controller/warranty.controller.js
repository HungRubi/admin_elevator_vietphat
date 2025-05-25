const Order = require("../model/orders.model");
const Warranty = require('../model/warranty.model');
const OrderDetail = require("../model/orderDetail.model");

class WarrantyController {
    async add (req, res) {
        try{
            const orders = await Order
            .find()
            .populate("user_id")
            .sort({ createdAt: -1 })
            .lean();
            const orderFormat = await Promise.all(
                orders.map(async (order) => {
                    const orderDetail = await OrderDetail
                    .find({ order_id: order._id })
                    .populate("product_id")
                    return {
                        ...order,
                        orderDetail
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
}

module.exports = new WarrantyController();