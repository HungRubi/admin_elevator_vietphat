const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const Custumer = require('../model/custumers.model');
const Product = require('../model/products.model');
const Orders = require('../model/orders.model');
class OdersController {
    
    /** [GET] /orders */
    index(req, res, next) {
        res.render('orders/orders');
    }
    
    /** [GET] /orders/add */
    add(req, res, next) {
        Promise.all([Product.find({}), Custumer.find({})])
            .then(([products, custumers]) => {
                res.render('orders/addOrder', {
                    products: mutipleMongooseoObject(products),
                    custumers: mutipleMongooseoObject(custumers),
                });
            })
        
    }

    /** [POST] /orders/store */
    store = async(req, res, next) => {
        try{
            const {
                userId,
                items, 
                totalPrice,
                status,
                shippingAddress,
                paymentMethod,
                paymentStatus,
            } = req.body;
    
            const order = new Orders({
                userId,
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