class OdersController {
    
    index(req, res, next) {
        res.render('orders/orders');
    }
 
}

module.exports = new OdersController();