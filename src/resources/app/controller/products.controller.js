class ProductsController {
    
    index(req, res, next) {
        res.render('products/products');
    }
 
}

module.exports = new ProductsController();