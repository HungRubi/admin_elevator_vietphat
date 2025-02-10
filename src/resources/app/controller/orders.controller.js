const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const User = require('../model/user.model');
const Product = require('../model/products.model');
const Orders = require('../model/orders.model');
const OrderDetail = require('../model/orderDetail.model')
class OdersController {
    
    /** [GET] /orders */
    index(req, res, next) {
        res.render('orders/orders');
    }
    
    /** [GET] /orders/add */
    add(req, res, next) {
        Promise.all([Product.find({}), User.find({ authour: 'customer' })])
            .then(([products, users]) => {
                res.render('orders/addOrder', {
                    products: mutipleMongooseoObject(products),
                    users: mutipleMongooseoObject(users),
                });
            })
    }

    /** [POST] /orders/store */
    store = async(req, res, next) => {
        try{
            const { user_id, total_price, shipping_address, payment_method, items, status } = req.body;
            const order = new Orders({
                user_id,
                total_price,
                shipping_address,
                payment_method,
                status
            });
    
            await order.save();
            const orderId = order._id;
            const orderDetails = items.map(product => ({
                order_id: orderId, 
                product_id: product.product_id,
                quantity: product.quantity,
                discount_id: discount_id,
                total_price: product.price
            }));
            await OrderDetail.insertMany(orderDetails);
            res.redirect('/orders');
        }catch(err){
            next(err)
        }
    }
}

module.exports = new OdersController();