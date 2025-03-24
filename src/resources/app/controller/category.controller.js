const Discount = require('../model/discount.model');
const Product = require('../model/products.model');
const CategoryProduct = require('../model/categoryProduct.model');
const { mongooseToObject } = require('../../util/mongoose.util');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util');
const {createSlug} = require('../../util/createSlug.util');
const {importDate} = require('../../util/importDate.util');
const Banner = require('../model/banner.model');
const Video = require('../model/video.model');
const Article = require('../model/article.model');

class CategoryController{

    /** ===== PRODUCT ===== */

    /** [GET] /category/product */
    async product(req, res, next) {
        try {
            const searchQuery = req.query.timkiem?.trim() || '';
    
            if (searchQuery) {
                const searchProduct = await CategoryProduct.find({
                    name: { $regex: searchQuery, $options: 'i' }
                });
    
                const formatType = searchProduct.map(type => ({
                    ...type.toObject(),
                    lastUpdate: formatDate(type.updatedAt)
                }));
    
                const data = {
                    searchType: true,
                    searchProduct: formatType,
                    searchQuery
                };
    
                return res.status(200).json({ data });
            } 
            
            const categoryProduct = await CategoryProduct.find({});
            const totalOrder = await CategoryProduct.countDocuments();
            const totalPage = Math.ceil(totalOrder / 10);
    
            const formatType = categoryProduct.map(type => ({
                ...type.toObject(),
                lastUpdate: formatDate(type.updatedAt)
            }));
    
            const data = {
                totalPage,
                categoryProduct: formatType,
                searchType: false
            };
    
            res.status(200).json({ data });
    
        } catch (error) {
            res.status(500).json({ message: err });
        }
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
            res.status(200).json({message: "Thành công"});
        }catch(err){
            res.status(200).json({message: "Thất bại"});
        }
    }

    /** [GET] /category/product/:id/edit */
    async editProduct(req, res, next) {
        try{
            const categoryProduct = await CategoryProduct.findById(req.params.id);
            const data = {categoryProduct}
            res.status(200).json({data});
        }catch(err){
            res.status(200).json({message: err})
        }
    }

    /** [PUT] /category/product/:id */
    updateProduct(req, res, next) {
        const {name, description} = req.body;
        console.log(req.body)
        const slug = createSlug(name);
        CategoryProduct.updateOne({_id: req.params.id},{name,description,slug})
        .then(() => {
            res.status(200).json({message: "Thành công"});
        })
        .catch(err => {
            res.status(200).json({message: "Thất bại: ", err});
        });
    }

    /** [DELETE] /category/product/:id*/
    destroyProduct(req, res, next) {
        CategoryProduct.deleteOne({_id: req.params.id})
        .then(() => {
            res.status(200).json({message: "Thành công"});
        })
        .catch(err => {
            res.status(200).json({message: "Thất bại: ", err});
        });
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
                const data = {
                    searchType: true,
                    searchDiscount: discountFormat,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                }
                return res.status(200).json({ data})
            }
            const discounts = await Discount.find()
                .sort({ [sortField]: sortOrder })
                .lean();
    
            const formatDiscount = discounts.map(discount => ({
                ...discount,
                startDate: formatDate(discount.start_date),
                endDate: formatDate(discount.end_date),
                lastUpdate: formatDate(discount.updatedAt),
            }));
    
            const totalDiscount = await Discount.countDocuments();
            const totalPage = Math.ceil(totalDiscount / 10);
    
            const data = {
                formatDiscount,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            }
            res.status(200).json({data});
        }catch(err){
            next(err)
        }
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
                endDate: importDate(discounts.end_date),
                startDate: importDate(discounts.start_date),
            }
            const data = {discount}
            res.status(200).json({data})
        }catch(err) {
            res.status(500).json({message: err})
        }
    }

    /** [UPDATE] /category/discount/:id */
    updateDiscount(req, res, next) {
        Discount.updateOne({_id: req.params.id}, req.body)
        .then(() => {
            res.redirect('/category/discount');
        })
        .catch(next);
    }

    /** ===== BANNER ===== */

    /** [GET] /category/banner */
    banner = async(req, res, next) => {
        let sortField = req.query.sort || 'name'; 
        let sortOrder = req.query.order === 'desc' ? -1 : 1;
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery){
                const banner = await Banner.find({
                        name: { $regex: searchQuery, $options: 'i' }
                }).sort({ [sortField]: sortOrder }).lean();
                const bannerFormat = banner.map(ban => ({
                    ...ban,
                    lastUpdate: formatDate(ban.updatedAt),
                }));
                const data = {
                    searchType: true,
                    searchBanner: bannerFormat,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc',
                }
                return res.status(200).json({data})
            }
            const banner = await Banner.find()
                .sort({ [sortField]: sortOrder })
                .lean();
    
            const formatBanner = banner.map(discount => ({
                ...discount,
                lastUpdate: formatDate(discount.updatedAt),
            }));
    
            const totalBanner = await Banner.countDocuments();
            const totalPage = Math.ceil(totalBanner / 10);
            
            const data = {
                formatBanner,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            }
            res.status(200).json({data});
        }catch(err){
            next(err)
        }
    }

    /** [POST] /category/banner/store */
    storeBanner = async (req, res , next) => {
        try{
            const{
                name,
                thumbnail,
                status,
            } = req.body;
            const slug = createSlug(name);
            const banner = new Banner({
                name,
                thumbnail,
                status,
                slug
            })

            await banner.save();
            res.redirect('/category/banner');

        }catch(err){
            next(err)
        }
    }

    /** [GET] /category/banner/:id */
    async editBanner(req, res, next) {
        try{
            const banner = await Banner.findById({_id: req.params.id});
            const data = {banner: mongooseToObject(banner)}
            res.status(200).json({data})
        }catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [PUT] /category/banner/:id */
    updateBanner(req, res, next) {
        Banner.updateOne({_id: req.params.id}, req.body)
        .then(() => {
            res.redirect('/category/banner')
        })
        .catch(err => {
            next(err);
        })
    }

    /** [DELETE] /category/banner/:id */
    destroyBanner(req, res, next) {
        Banner.deleteOne({_id: req.params.id})
        .then(() => {
            res.redirect('/category/banner')
        })
        .catch(err => {
            next(err);
        })
    }

    /** ==== VIDEO ==== */

    /** [GET] /category/video */
    async getCategoryVideo(req, res, next) {
        try {
            const searchQuery = req.query.timkiem?.trim() || '';
    
            if (searchQuery) {
                const searchProduct = await Video.find({
                    name: { $regex: searchQuery, $options: 'i' }
                });
    
                const formatType = searchProduct.map(type => ({
                    ...type.toObject(),
                    lastUpdate: formatDate(type.updatedAt)
                }));
    
                const data = {
                    searchType: true,
                    searchVideo: formatType,
                    searchQuery
                };
    
                return res.status(200).json({ data });
            } 
            
            const categoryProduct = await Video.find({});
            const totalOrder = await Video.countDocuments();
            const totalPage = Math.ceil(totalOrder / 10);
    
            const formatType = categoryProduct.map(type => ({
                ...type.toObject(),
                lastUpdate: formatDate(type.updatedAt)
            }));
    
            const data = {
                totalPage,
                searchType: false,
                categoryVideo: formatType,
            };
    
            res.status(200).json({ data });
    
        } catch (error) {
            res.status(500).json({ message: err });
        }
    }

    /** [POST] /category/video/store */
    async addCategoryVideo(req, res, next) {
        try{
            const {name, content, thumbnail,video_url,status} = req.body;
            console.log(req.body);
            if(status === ''){
                status = 'public';
            }
            let slug = createSlug(name);
            const video = new Video({
                name,
                content,
                thumbnail,
                video_url,
                status,
                slug
            })
            await video.save();
            res.status(200).json({message: "Thành công"});
        }catch(err){
            res.status(500).json({message: "Thất bại"})
        }
    }

    /** [GET] /category/video/:id/edit */
    async editVideo(req, res, next) {
        try{
            const video = await Video.findById({_id: req.params.id});

            res.status(200).json({video})
        }catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [GET] /category/video/:slug */
    async getDetailVideo(req, res, next) {
        try{
            const video = await Video.findOne({slug: req.params.slug});
            const format = {
                ...video.toObject(),
                formateDate: formatDate(video.createdAt)
            }
            const articles = await Article.find().sort({ createdAt: -1 }).limit(4);
            const formNewArticles = articles.map(type => ({
                ...type.toObject(),
                formatedDate: formatDate(type.updatedAt)
            }));
            const product = await Product.find().sort({ createdAt: -1 }).limit(4);
            const formNewProduct = product.map(type => ({
                ...type.toObject(),
                formatedDate: formatDate(type.createdAt)
            }));
            const videoAll = await Video.find({}).sort({createdAt: -1})
            const formatVideo = videoAll.map(item => ({
                ...item.toObject(),
                format: formatDate(item.createdAt)
            }))
            const data = {
                video: format,
                videos: formatVideo,
                articleSuggest: formNewArticles,
                productSuggest: formNewProduct,
            }
            res.status(200).json({data})
        }catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [PUT] /category/video/:id */
    updateVideo(req, res, next) {
        const {
            name,
            content,
            thumbnail,
            video_url,
            status
        } = req.body;
        console.log(req.body)
        console.log(req.params.id)
        const slug = createSlug(name);
        Video.updateOne({_id: req.params.id},{
            name,
            content,
            thumbnail,
            video_url,
            status,
            slug
        })
        .then(() => {
            res.status(200).json({message: "Thành công"});
        })
        .catch(err => {
            res.status(200).json({message: "Thất bại: "});
        });
    }

    /** [DELETE] */
    destroyProduct(req, res, next) {
        CategoryProduct.deleteOne({_id: req.params.id})
        .then(() => {
            res.status(200).json({message: "Thành công"});
        })
        .catch(err => {
            res.status(200).json({message: "Thất bại: ", err});
        });
    }

}

module.exports = new CategoryController();