const Products = require('../model/products.model');
const {createSlug} = require('../../util/createSlug.util');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util')
class ProductsController {
    
    /** [GET] /products */
    index(req, res, next) {
        res.render('products/products');
    }
    
    /** [GET] /products/add */
    add(req, res, next){
        res.render('products/addProduct')
    }

    /** [POST] /products/store */
    store = async (req, res, next) => {
        try{
            const {
                name,
                description,
                price,
                unit,
                minimum,
                stock,
                thumbnail_main,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
                category,
            } = req.body;
            let slug = createSlug(name);
            const product = new Products({
                name,
                description,
                price,
                unit,
                minimum,
                stock,
                thumbnail_main,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
                slug,
                category,
            })
            await product.save();
            res.redirect('/products');
        }
        catch(error){
            next(error);
        };
    }

    /** [GET] /products/edit */
    edit(req, res, next){
        Products.findById(req.params.id)
        .then(product => {
            res.render('products/editProduct', {
                product: mongooseToObject(product),
            })
        })
    }
    
    /** [PUT] /products/:id */
    update(req, res, next) {
        console.log(req.body);
        Products.updateOne({_id: req.params.id}, req.body)
        .then(() => {
            res.redirect('/products');
        })
        .catch(error => {
            next(error);
        });
    }

    /** [DELETE] /products/:id */
    delete(req, res, next) {
        Products.deleteOne({_id: req.params.id})
        .then(() => {
            res.redirect('back');
        })
        .catch(error => {
            next(error);
        });
    }

    /** [GET] /products/api/getallproducts */
    getAllProducts(req, res, next){
        const {page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        const skip = (pageNumber - 1) * limitNumber;
        Products.find()
            .skip(skip)
            .limit(limitNumber)
            .then(product => {
                const formatProducts = product.map(pro => {
                    return{
                        ...pro.toObject(),
                        formatedDate: formatDate(pro.updatedAt)
                    }
                })
                Products.countDocuments()
                    .then(totalItem => {
                        res.json({
                            product: formatProducts,
                            totalItem,
                            currentPage: pageNumber,
                            totalPage: Math.ceil(totalItem / limitNumber)
                        })
                    })
            })
            .catch(next)
    }

    /** [GET] /products/api/getproductsfe */
    getProductsFe(req, res, next){
        const {page = 1, limit = 12 } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        const skip = (pageNumber - 1) * limitNumber;
        Products.find()
            .skip(skip)
            .limit(limitNumber)
            .then(product => {
                const formatProducts = product.map(pro => {
                    return{
                        ...pro.toObject(),
                        formatedDate: formatDate(pro.updatedAt)
                    }
                })
                Products.countDocuments()
                    .then(totalItem => {
                        res.json({
                            product: formatProducts,
                            totalItem,
                            currentPage: pageNumber,
                            totalPage: Math.ceil(totalItem / limitNumber)
                        })
                    })
            })
            .catch(next)
    }
    
    /** [GET] /products/api/getcop */
    getProductCop(req, res, next){
        Products.find({category: 'cop'})
            .then(products => {
                res.json(products);
            })
            .catch(next);
    }

    /** [GET] /products/api/getdien */
    getProductDien(req, res, next){
        Products.find({category: 'dien'})
            .then(products => {
                res.json(products);
            })
            .catch(next);
    }

    /** [GET] /products/api/getinox */
    getProductInox(req, res, next){
        Products.find({category: 'inox'})
            .then(products => {
                res.json(products);
            })
            .catch(next);
    }

    /** [GET] /products/api/getthep */
    getProductThep(req, res, next){
        Products.find({category: 'thep'})
            .then(products => {
                res.json(products);
            })
            .catch(next);
    }

    /** [GET] /products/api/getdetailproduct/:slug */
    getdetailproduct(req, res, next){
        Products.findOne({ slug: req.params.slug })
            .then((product) => {
                res.json(product);
            })
            .catch(next);
    }

    /** [GET] /products/api/suggestproduct */
    getSuggestProduct(req, res, next) {
        Products.aggregate([{ $sample: { size: 4 } }])
            .then((pro) => {
                res.json(pro);
            })
            .catch(next);
    }
}

module.exports = new ProductsController();