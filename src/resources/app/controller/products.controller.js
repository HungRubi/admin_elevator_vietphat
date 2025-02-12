const Products = require('../model/products.model');
const CategoryProduct = require('../model/categoryProduct.model');
const {createSlug} = require('../../util/createSlug.util');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util');
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
                sale,
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
                sale,
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
    async edit(req, res, next) {
        try {
            const [product, categoryPro] = await Promise.all([
                Products.findById(req.params.id),
                CategoryProduct.find()
            ]);
    
            if (!product) {
                return res.status(404).send("Sản phẩm không tồn tại");
            }
            const categoryName = await CategoryProduct.findById(product.category);
    
            res.render('products/editProduct', {
                categoryName: mongooseToObject(categoryName),
                product: mongooseToObject(product),
                categoryPro: mutipleMongooseoObject(categoryPro),
            });
    
        } catch (error) {
            next(error);
        }
    }
    
    
    /** [PUT] /products/:id */
    update(req, res, next) {
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
    async getProductCop(req, res, next){
        try{
            const category = await CategoryProduct.findOne({ name: "COP/LOP" });
            if (!category) {
                return res.status(404).json({ message: "Không tìm thấy danh mục 'cop'" });
            }
            const products = await Products.find({ category: category._id }).limit(8);
            res.json(products);
        }catch(err){
            next(err);
        }
    }

    /** [GET] /products/api/getdien */
    async getProductDien(req, res, next){
        try{
            const category = await CategoryProduct.findOne({ name: "Linh kiện điện" });
            if (!category) {
                return res.status(404).json({ message: "Không tìm thấy danh mục 'Linh kiện điện'" });
            }
            const products = await Products.find({ category: category._id }).limit(8);
            res.json(products);
        }catch(err){
            next(err);
        }
    }

    /** [GET] /products/api/getinox */
    async getProductInox(req, res, next){
        try{
            const category = await CategoryProduct.findOne({ name: "Linh kiện inox" });
            if (!category) {
                return res.status(404).json({ message: "Không tìm thấy danh mục 'Linh kiện inox'" });
            }
            const products = await Products.find({ category: category._id }).limit(8);
            res.json(products);
        }catch(err){
            next(err);
        }
    }

    /** [GET] /products/api/getthep */
    async getProductThep(req, res, next){
        try{
            const category = await CategoryProduct.findOne({ name: "Linh kiện thép" });
            if (!category) {
                return res.status(404).json({ message: "Không tìm thấy danh mục 'Linh kiện thép'" });
            }
            const products = await Products.find({ category: category._id }).limit(8);
            res.json(products);
        }catch(err){
            next(err);
        }
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