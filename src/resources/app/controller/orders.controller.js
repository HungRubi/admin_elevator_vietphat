const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const User = require('../model/user.model');
const Product = require('../model/products.model');
const Orders = require('../model/orders.model');
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
            const {
                user_id,
                items, 
                totalPrice,
                status,
                shippingAddress,
                paymentMethod,
                paymentStatus,
            } = req.body;
    
            const order = new Orders({
                user_id,
                items, 
                totalPrice,
                status,
                shippingAddress,
                paymentMethod,
                paymentStatus,
            });
    
            await order.save();
            res.redirect('/orders');
        }catch(err){
            next(err)
        }
    }
}

module.exports = new OdersController();