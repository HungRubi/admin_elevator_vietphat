const Discount = require('../model/discount.model');
const Product = require('../model/products.model');
const CategoryProduct = require('../model/categoryProduct.model');
const { mongooseToObject } = require('../../util/mongoose.util');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util');
const {createSlug} = require('../../util/createSlug.util');
const {importDate} = require('../../util/importDate.util');

class CategoryController{

    /** ===== PRODUCT ===== */

    /** [GET] /category/product */
    product(req, res, next) {
        const searchQuery = req.query.timkiem?.trim() || '';
        if(searchQuery) {
            CategoryProduct.find({
                name: { $regex: searchQuery, $options: 'i' }
            })
            .then(searchProduct => {
                const formatType = searchProduct.map(type => {
                    return{
                        ...type.toObject(),
                        lastUpdate: formatDate(type.updatedAt)
                    }
                });
                res.render('category/product/product', {
                    searchType: true,
                    searchProduct: formatType,
                    searchQuery
                })
            })
            .catch(next)
        }else{
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
                    searchType: false,
                })
            }).catch(next)
        }
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

    /** [PUT] /category/product/:id/edit */
    updateProduct(req, res, next) {
        const {name, description} = req.body;
        const slug = createSlug(name);
        CategoryProduct.updateOne({_id: req.params.id},{name,description,slug})
        .then(() => {
            res.redirect('/category/product');
        })
        .catch(next);
    }

    /** [DELETE] /category/product/:id/deleted*/
    destroyProduct(req, res, next) {
        CategoryProduct.deleteOne({_id: req.params.id})
        .then(() => {
            res.redirect('/category/product');
        })
        .catch(next);
    }

    /** [GET] /category/product/all */
    getCategoryProduct(req, res, next) {
        CategoryProduct.find()
        .then(category => {
            res.json(category)
        })
        .catch(next)
    }

    /** [GET] /category/product/:slug */
    async getProductCategory(req, res, next){
        try {
            const { slug } = req.params; 
    
            const category = await CategoryProduct.findOne({ slug });
            if (!category) {
                return res.status(404).json({ message: "Không tìm thấy danh mục" });
            }
    
            const products = await Product.find({ category: category._id });
    
            res.json(products);
        } catch (error) {
            next(error);
        }
    }
    /** ===== DISCOUNT ===== */

    /** [GET] /category/discount */
    async discount(req, res, next) {
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let skip = (page - 1) * limit;
        let sortField = req.query.sort || 'title'; 
        let sortOrder = req.query.order === 'desc' ? -1 : 1;
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery){
                const discounts = await Discount.find({
                        title: { $regex: searchQuery, $options: 'i' }
                }).sort({ [sortField]: sortOrder }).lean();
                const discountFormat = discounts.map(discount => ({
                    ...discount,
                    startDate: formatDate(discount.start_date),
                    endDate: formatDate(discount.end_date),
                    lastUpdate: formatDate(discount.updatedAt),
                }));
                return res.render('category/discount/discount', {
                    searchType: true,
                    searchDiscount: discountFormat,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                })
            }
            const discounts = await Discount.find()
                .skip(skip)
                .limit(limit)
                .sort({ [sortField]: sortOrder })
                .lean();
    
            const formatDiscount = discounts.map(discount => ({
                ...discount,
                startDate: formatDate(discount.start_date),
                endDate: formatDate(discount.end_date),
                lastUpdate: formatDate(discount.updatedAt),
            }));
    
            const totalDiscount = await Discount.countDocuments();
            const totalPage = Math.ceil(totalDiscount / limit);
    
            res.render('category/discount/discount', {
                formatDiscount,
                currentPage: page,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            });
        }catch(err){
            next(err)
        }
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

    /** [GET] /category/discount/:id/edit */
    async editDiscount(req, res, next) {
        try{
            const discounts = await Discount.findById({_id: req.params.id});
            const discount = {
                ...discounts.toObject(),
                formatDate: importDate(discounts.end_date)
            }
            console.log(discount.formatDate)
            res.render('category/discount/editDiscount', {
                discount
            })
        }catch(err) {
            next(err);
        }
    }

    
    updateDiscount(req, res, next) {
        Discount.updateOne({_id: req.params.id}, req.body)
        .then(() => {
            res.redirect('/category/discount');
        })
        .catch(next);
    }
}

module.exports = new CategoryController();