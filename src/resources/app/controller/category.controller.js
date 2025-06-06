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

    /** [GET] category/product/get-product/:id */
    async getProductByCategory (req, res) {
        try{
            const id = req.params.id;
            const products = await Product.find({category: id}).populate("category");
            res.status(200).json({
                products
            })
        }catch(error) {
            console.log("Lỗi: ", error)
            res.status(500).json({ message: "Lỗi server vui lòng thử lại sau" });
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
        let sortField = req.query.sort || 'createdAt'; 
        let sortOrder = req.query.order === 'desc' ? 1 : -1;
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
        console.log(req.body)
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
            res.status(200).json({
                message: "Thêm voucher thành công!"
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau'
            })
        }
    }

    /** [GET] /category/discount/:id/edit */
    async editDiscount(req, res) {
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
    async updateDiscount(req, res) {
        try {
            const discountId = req.params.id;
            const updateData = { ...req.body };
            
            // Kiểm tra và set is_active dựa trên end_date
            if (updateData.end_date) {
                const endDate = new Date(updateData.end_date);
                const now = new Date();
                if (endDate > now) {
                    updateData.is_active = 'active';
                } else {
                    updateData.is_active = 'stop';
                }
            }
            const updatedDiscount = await Discount.findByIdAndUpdate(
                discountId, 
                updateData, 
                { new: true }
            );
            
            if (!updatedDiscount) {
                return res.status(404).json({
                    message: "Không tìm thấy voucher!"
                });
            }
            
            if (updatedDiscount.use_count >= updatedDiscount.use_limit && updatedDiscount.is_active === 'active') {
                updatedDiscount.is_active = 'stop';
                await updatedDiscount.save();
            }
            res.status(200).json({
                message: "Cập nhật voucher thành công!",
                discount: updatedDiscount
            });
        } catch(error) {
            console.log(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau'
            });
        }
    }

    /** [DELETE] /category/discount/:id */
    async deleteDiscount(req, res) {
        try {
            const { id } = req.params;
            
            const deletedDiscount = await Discount.findByIdAndDelete(id);
            
            if (!deletedDiscount) {
                return res.status(404).json({
                    message: "Voucher không tồn tại"
                });
            }
            
            res.status(200).json({
                message: "Xóa voucher thành công!",
            });
            
        } catch(error) {
            console.log(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau'
            });
        }
    }

    /** [GET] /category/discount/filter */
    async filterDiscount(req, res) {
        try{
            const {is_active, endDate, startDate} = req.query;
            let query = {}
            if(is_active){
                query.is_active = is_active
            }
            if(endDate && startDate){
                query.start_date = { $gte: new Date(startDate) };  
                query.end_date = { $lte: new Date(endDate) };      
            }
            const discounts = await Discount.find(query).lean();
            const formatType = discounts.map(type => ({
                ...type,
                endDate: formatDate(type.end_date),
                startDate: formatDate(type.start_date),
                lastUpdate: formatDate(type.updatedAt)
            }));
            const totalPage = Math.ceil(discounts.length / 10)
            res.status(200).json({
                formatDiscount: formatType,
                totalPage
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau'
            })
        }
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
                    name: { $regex: searchQuery, $options: 'i' }})
                .populate("discount")
                .sort({ [sortField]: sortOrder })
                .lean();
                const bannerFormat = banner.map(ban => ({
                    ...ban,
                    lastUpdate: formatDate(ban.createdAt),
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
                .populate("discount")
                .sort({ [sortField]: sortOrder })
                .lean();
    
            const formatBanner = banner.map(discount => ({
                ...discount,
                lastUpdate: formatDate(discount.createdAt),
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
                thumbnail_1,
                content,
                status,
                disocunt
            } = req.body;
            const slug = createSlug(name);
            const banner = new Banner({
                name,
                thumbnail,
                thumbnail_1,
                content,
                status,
                disocunt,
                slug
            })
            await banner.save();
            res.status(200).json({
                message: "Thêm banner thành công!"
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
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
    async updateBanner(req, res, next) {
        try{
            const {name, ...rest} = req.body
            const slug = createSlug(name);
            await Banner.updateOne(
                {_id: req.params.id},
                {...rest, name ,slug }
            )
            res.status(200).json({
                message: "Cập nhật banner thành công!"
            })
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau",
            })

        }
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

    /** [GET] /category/banner/filter */
    async filterBanner(req, res) {
        try{
            console.log(req.query)
            const {status, startDate, endDate} = req.query;
            let query = {};
            if(status) {
                query.status = status;
            }
            if(startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
            const banners = await Banner.find(query).lean();
            const bannerFormat = banners.map(v => ({
                ...v,
                lastUpdate: formatDate(v.createdAt),
            }))
            const totalPage = Math.ceil(banners.length / 10)
            res.status(200).json({
                bannerFormat,
                totalPage
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
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
                    lastUpdate: formatDate(type.createdAt)
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
                lastUpdate: formatDate(type.createdAt)
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
            res.status(200).json({message: "Thêm video thành công!"});
        }catch(err){
            res.status(500).json({message: "Lỗi server vui lòng thử lại sau"})
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
            res.status(200).json({message: "Cập nhật video thành công!"});
        })
        .catch(err => {
            res.status(500).json({message: "Thất bại: "});
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

    /** [GET] /category/video/filter */
    async filterVideo (req, res) {
        try{
            console.log(req.query)
            const {status, startDate, endDate} = req.query;
            let query = {};
            if(status) {
                query.status = status;
            }
            if(startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
            const videos = await Video.find(query).lean();
            const videoFormat = videos.map(v => ({
                ...v,
                lastUpdate: formatDate(v.createdAt),
            }))
            const totalPage = Math.ceil(videos.length / 10)
            res.status(200).json({
                videoFormat,
                totalPage
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau"
            })
        }
    }

}

module.exports = new CategoryController();