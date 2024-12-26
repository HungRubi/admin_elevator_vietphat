const Products = require('../model/products.model');
const {createSlug} = require('../../util/createSlug.util');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
class ProductsController {
    
    /** [GET] /products */
    index(req, res, next) {
        Products.find()
        .then(product => {
            res.render('products/products',{
                product: mutipleMongooseoObject(product),
            })
        })
        .catch(next);
    }
    
    /** GET /products/add */
    add(req, res, next){
        res.render('products/addProduct')
    }

    store = async (req, res, next) => {
        try{
            const {name, price, description, stock, unit} = req.body;
            let slug = createSlug(name);

            const product = new Products({
                name,
                price,
                description,
                stock,
                unit,
                slug,
                image
            })
            await product.save();
            res.redirect('/products')
        }
        catch(error){
            next(error);
        };
    }

    edit(req, res, next){
        Products.findById(req.params.id)
        .then(product => {
            res.render('products/editProduct', {
                product: mongooseToObject(product),
            })
        })
    }
    
    update(req, res, next) {
        console.log(req.body);
        Products.updateOne({_id: req.params.id}, req.body)
        .then(() => res.redirect('/products'))
        .catch(next);
    }

    delete(req, res, next) {
        Products.deleteOne({_id: req.params.id})
        .then(() => {res.redirect('back')})
        .catch(next)
    }
}

module.exports = new ProductsController();