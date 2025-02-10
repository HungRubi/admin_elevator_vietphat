const Discount = require('../model/discount.model');
const Product = require('../model/products.model');
const CategoryProduct = require('../model/categoryProduct.model');
const { mongooseToObject } = require('../../util/mongoose.util');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util');
const {createSlug} = require('../../util/createSlug.util');

class CategoryController{

    /** ===== PRODUCT ===== */

    /** [GET] /category/product */
    product(req, res, next) {
        CategoryProduct.find({})
        .then(categoryProduct => {
            const formatType = categoryProduct.map(type => {
                return{
                    ...type.toObject(),
                    lastUpdate: formatDate(type.updatedAt)
                }
            });
            res.render('category/product/product', {
                categoryProduct: formatType,
            })
        })
    }

    /** [GET] /category/product/add */
    addProduct(req, res, next) {
        res.render('category/product/addProduct');
    }

    /** [POST] /category/product/store */
    storeProduct = async (req, res, next) => {
        try{
            const {name, description} = req.body;
            let slug = createSlug(name);
            const categoryProduct = new CategoryProduct({
                name,
                description,
                slug
            })
            await categoryProduct.save();
            res.redirect('/category/product')
        }catch(err){
            next(err);
        }
    }

    /** [GET] /category/product/:id/edit */
    editProduct(req, res, next) {
        CategoryProduct.findById(req.params.id)
        .then(categoryProduct => {
            res.render('category/product/editProduct', {
                categoryProduct: mongooseToObject(categoryProduct)
            })
        })
    }

    /** ===== DISCOUNT ===== */

    /** [GET] /category/discount */
    discount(req, res, next) {
        Discount.find({})
        .then(discounts => {
            const formatDiscount = discounts.map(discount => {
                return{
                    ...discount.toObject(),
                    start: formatDate(discount.start_date),
                    end: formatDate(discount.end_date),
                    lastUpdate: formatDate(discount.updatedAt),
                }
            })
            res.render('category/discount/discount', {
                discounts: formatDiscount,
            })
        })
    }

    /** [GET] /category/discount/add */
    addDiscount(req, res, next) {
        Product.find({})
        .then(products => {
            res.render('category/discount/addDiscount',{
                products: mutipleMongooseoObject(products)
            })
        })
    }

    /** [POST] /category/discount/store */
    storeDiscount = async (req, res , next) => {
        try{
            const{
                title,
                description,
                discount_type,
                value_discount,
                end_date,
                apply_product,
                minimum_purchase,
                use_limit,
                use_count
            } = req.body;

            const discount = new Discount({
                title,
                description,
                discount_type,
                value_discount,
                end_date,
                apply_product,
                minimum_purchase,
                use_limit,
                use_count
            })

            await discount.save();
            res.redirect('/category/discount');

        }catch(err){
            next(err)
        }
    }
}

module.exports = new CategoryController();