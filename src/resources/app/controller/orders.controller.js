const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const Custumer = require('../model/custumers.model');
const Product = require('../model/products.model');

class OdersController {
    
    index(req, res, next) {
        res.render('orders/orders');
    }
    
    add(req, res, next) {
        Promise.all([Product.find({}), Custumer.find({})])
            .then(([products, custumers]) => {
                res.render('orders/addOrder', {
                    products: mutipleMongooseoObject(products),
                    custumers: mutipleMongooseoObject(custumers),
                });
            })
        
    }
}

module.exports = new OdersController();