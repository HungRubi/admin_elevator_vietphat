const Products = require('../model/products.model');
const {createSlug} = require('../../util/createSlug.util');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util')
class ProductsController {
    
    /** [GET] /products */
    index(req, res, next) {
        Products.find()
        .then(product => {
            const formatProducts = product.map(pro => {
                return{
                    ...pro.toObject(),
                    formatedDate: formatDate(pro.updatedAt)
                }
            })
            res.render('products/products',{
                product: formatProducts,
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
            const {
                name,
                description,
                sale,
                price,
                unit,
                minimum,
                stock,
                thumbnail_main,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
            } = req.body;
            let slug = createSlug(name);
            let discount = parseFloat(sale.replace('%', ''));
            const product = new Products({
                name,
                description,
                discount,
                price,
                unit,
                minimum,
                stock,
                thumbnail_main,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
                slug,
            })
            console.log(`body: ${req.body}`);
            console.log(`product: ${product}`);
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