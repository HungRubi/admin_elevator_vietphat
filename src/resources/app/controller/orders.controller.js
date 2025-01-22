class OdersController {
    
    index(req, res, next) {
        res.render('orders/orders');
    }
    
    add(req, res, next) {
        res.render('orders/addOrder');
    }
}

module.exports = new OdersController();