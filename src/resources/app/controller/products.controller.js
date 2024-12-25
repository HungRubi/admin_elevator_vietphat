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
                slug
            })
            await product.save();
            res.redirect('/products')
        }
        catch(error){
            next(error);
        };
    }
}

module.exports = new ProductsController();