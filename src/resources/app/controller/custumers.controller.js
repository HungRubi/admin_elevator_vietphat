class CustomersController {
    
    index(req, res, next) {
        res.render('custumers/custumers');
    }
 
}

module.exports = new CustomersController();