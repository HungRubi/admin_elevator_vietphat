class CategoryController{
    product(req, res, next) {
        res.render('category/categoryProduct')
    }
}

module.exports = new CategoryController();