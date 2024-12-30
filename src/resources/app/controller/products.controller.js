const Products = require('../model/products.model');
const {createSlug} = require('../../util/createSlug.util');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util')
class ProductsController {
    
    /** [GET] /products */
    index(req, res, next) {
        res.render('products/products');
        // Products.find()
        // .then(product => {
        //     const formatProducts = product.map(pro => {
        //         return{
        //             ...pro.toObject(),
        //             formatedDate: formatDate(pro.updatedAt)
        //         }
        //     })
        //     res.render('products/products',{
        //         product: formatProducts,
        //     })
        // })
        // .catch(next);
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

    /** [PUT] /products/edit */
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
        .then(() => res.redirect('/products'))
        .catch(next);
    }

    /** [DELETE] /products/:id */
    delete(req, res, next) {
        Products.deleteOne({_id: req.params.id})
        .then(() => {res.redirect('back')})
        .catch(next)
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
}

module.exports = new ProductsController();