const Product = require('../model/products.model');
const CategoryProduct = require('../model/categoryProduct.model');
const {importDate} = require('../../util/importDate.util');
const {createSlug} = require('../../util/createSlug.util');
const Comment = require('../model/comments.model');
const User = require('../model/user.model');
const { formatDate } = require('../../util/formatDate.util');
class ProductsController {

    /** [GET] /products/admin */
    async index(req, res, next) {
        let sortField = req.query.sort || 'createdAt'; 
        let sortProduct = req.query.product === 'desc' ? 1 : -1;
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery){
                const products = await Product.find({
                    name: { $regex: searchQuery, $options: 'i' }
                })
                .sort({ [sortField]: sortProduct })
                .populate('category')
                .populate('supplier')
                .lean();
                const productFormat = products.map(p => ({
                    ...p,
                    formatDate: importDate(p.createdAt)
                }))
                const data = {
                    searchType: true,
                    searchProduct: productFormat,
                    currentSort: sortField,
                    currentProduct: sortProduct === 1 ? 'asc' : 'desc',
                }
                return res.status(200).json({data})
            }
            const products = await Product.find()
                .populate('category')
                .populate('supplier')
                .sort({ [sortField]: sortProduct }) 
                .lean();
    
            const productFormat = products.map(p => ({
                ...p,
                formatDate: importDate(p.createdAt)
            }))

            const totalProduct = await Product.countDocuments();
            const totalPage = Math.ceil(totalProduct / 10);
            
            const data = {
                productFormat,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentProduct: sortProduct === 1 ? 'asc' : 'desc'
            }
            return res.status(200).json({data});
        }catch(error){
            console.log(error);
            return res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau :(("
            })
        }
    }

    /** [GET] /products */
    getProduct = async (req, res,next) => {
        try{
            const products = await Product.find().sort({createdAt: -1}).populate('category')
            const formatProducts = products.map(p => ({
                ...p.toObject(),
                formatDate: importDate(p.createdAt)
            }))
            const totalProduct = await Product.countDocuments();
            const totalPage = Math.ceil(totalProduct / 12);
            const data = { 
                products: formatProducts,
                totalPage,
            };
            res.status(200).json({data})
        }catch(error){
            console.log(error)
            res.status(500).json({message: error})
        }
    }

    /** [GET] /products/:id */
    async getProductEdit(req, res, next) {
        try{
            const product = await Product.findById(req.params.id);
            const categoryProduct = await CategoryProduct.find();
            const formatProduct = {
                    ...product.toObject(),
                    lastUpdate: importDate(product.updatedAt)
            }
            const data = {
                category: categoryProduct,
                product: formatProduct
            }
            res.status(200).json({data})
        }
        catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [GET] /products/fe/:slug */
    async getProductEditFe(req, res, next) {
        try{
            const product = await Product.findOne({slug: req.params.slug});
            const productSuggest = await Product.aggregate([{ $sample: { size: 8 } }]);
            const formatProduct = {
                    ...product.toObject(),
                    lastUpdate: importDate(product.updatedAt)
            }
            const comment = await Comment.find({ product_id: product._id}).populate('user_id');
            const formatComments = comment.map(comment => {
                return {
                    ...comment.toObject(),
                    lastUpdate: importDate(product.updatedAt),
                };
            });
            const data = {
                product: formatProduct,
                comment: formatComments,
                productSuggest
            }
            res.status(200).json({data})
        }
        catch(error){
            console.log(error)
            res.status(500).json({message: error})
        }
    }

    /** [GET] /products/selected */
    getProductSelected = async (req, res) => {
        try{
            console.log(req.body);
            const productId = req.body.productId;
            const product = await Product.find({_id : {$in: productId}});
            if(!product){
                return res.status(404).json({message: 'Sản phẩm không tồn tại'})
            }
            res.status(200).json({product})
        }catch(error){
            console.error(error);
            res.status(500).json({message: error})
        }
    }

    /** [POST] /products/store */
    async store (req, res) {
        try{
            const {
                name,
                description,
                sale,
                price,
                cog,
                shipping_cost,
                supplier,
                unit,
                category,
                minimum,
                thumbnail_main,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
            } = req.body;
            const slug = createSlug(name);
            const product = new Product({
                name,
                description,
                sale,
                price,
                shipping_cost,
                supplier,
                cog,
                unit,
                category,
                minimum,
                thumbnail_main,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
                slug
            })
            await product.save();
            res.status(200).json({
                message: "Thêm sản phẩm thành công"
            })
        }catch(error){
            console.log(error);
            res.status(404).json({
                message: "Lỗi server xin thử lại sau :(("
            })
        }
    }

    /** [PUT] /products/:id */
    async updateProduct (req, res) {
        try{
            const productId = req.params.id;
            await Product.updateOne({_id: productId}, req.body);
            res.status(200).json({
                message: "Cập nhật sản phẩm thành công :))"
            })
        }catch(error) {
            console.log(error);
            res.status(404).json({
                message: "Lỗi server vui lòng thử lại sau :(("
            })
        }
    }

    /** [DELETE] /products/:id */
    async destroyProduct(req, res) {
        try{
            const productId = req.params.id;
            await Product.deleteOne({_id: productId});
            res.status(200).json({
                message: "Bạn vừa xóa thành công 1 sản phẩm!"
            })
        }catch(error) {
            console.log(error);
            res.status(404).json({
                message: "Lỗi server vui lòng thử lại sau :(("
            })
        }
    }

    /** [GET] /products/filter */
    async filterProduct(req, res) {
        try{
            console.log(req.query)
            const {category, startDate, endDate} = req.query;
            let query = {}
            if(category){
                query.category = category
            }
            if(startDate && endDate){
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
            const products = await Product.find(query).populate('category').lean();
            const productFormat = products.map(p => ({
                ...p,
                formatDate: importDate(p.createdAt)
            }))
            const totalPage = Math.ceil(products.length / 10)
            res.status(200).json({
                productFormat,
                totalPage
            })
        }catch(error){
            console.log(error);
            res.status(404).json({
                message: "Lỗi server vui lòng thử lại sau :(("
            })
        }
    }
}

module.exports = new ProductsController();