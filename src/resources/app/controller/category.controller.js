const Discount = require('../model/discount.model');
const Product = require('../model/products.model');
const CategoryProduct = require('../model/categoryProduct.model');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util');
const { createSlug } = require('../../util/createSlug.util');
const { importDate } = require('../../util/importDate.util');
const { parseListQuery, clampLimit } = require('../../util/listQuery.util');
const Banner = require('../model/banner.model');
const Video = require('../model/video.model');
const Article = require('../model/article.model');
const mongoose = require('mongoose');

const SORT_CATEGORY = ['name', 'createdAt', 'updatedAt'];
const SORT_DISCOUNT = [
    'title',
    'createdAt',
    'updatedAt',
    'start_date',
    'end_date',
    'value_discount',
    'is_active',
];
const SORT_BANNER = ['name', 'createdAt', 'updatedAt', 'status'];
const SORT_VIDEO = ['name', 'createdAt', 'updatedAt', 'status'];
const SORT_PRODUCT = ['name', 'createdAt', 'updatedAt', 'price', 'sale', 'minimum'];

class CategoryController {
    /** ===== PRODUCT (danh mục) ===== */

    /** [GET] /category/product — staff */
    async product(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_CATEGORY,
                    defaultSortField: 'updatedAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

            const [rows, total] = await Promise.all([
                CategoryProduct.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                CategoryProduct.countDocuments(filter),
            ]);

            const formatType = rows.map((type) => ({
                ...type,
                lastUpdate: formatDate(type.updatedAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                data: {
                    searchType: Boolean(search),
                    searchProduct: search ? formatType : undefined,
                    categoryProduct: formatType,
                    total,
                    totalPage,
                    page,
                    limit,
                    offset: skip,
                    currentSort: sortField,
                    currentOrder: orderLabel,
                },
            });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Lỗi server' });
        }
    }

    /** [GET] category/product/get-product/:id — public */
    async getProductByCategory(req, res) {
        try {
            const id = req.params.id;
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ message: 'ID danh mục không hợp lệ' });
            }

            const { limit, skip, page, sort } = parseListQuery(req.query, {
                allowedSortFields: SORT_PRODUCT,
                defaultSortField: 'createdAt',
                defaultOrder: 'desc',
                defaultLimit: 24,
            });

            const filter = { category: id };
            const [products, total] = await Promise.all([
                Product.find(filter).populate('category').sort(sort).skip(skip).limit(limit).lean(),
                Product.countDocuments(filter),
            ]);

            res.status(200).json({
                products,
                total,
                totalPage: Math.max(1, Math.ceil(total / limit)),
                page,
                limit,
                offset: skip,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server vui lòng thử lại sau' });
        }
    }

    /** [POST] /category/product/store */
    storeProduct = async (req, res) => {
        try {
            const { name, description } = req.body;
            const slug = createSlug(name);
            const categoryProduct = new CategoryProduct({
                name,
                description,
                slug,
            });
            await categoryProduct.save();
            res.status(200).json({ message: 'Thành công' });
        } catch (err) {
            res.status(500).json({ message: 'Thất bại', error: err.message });
        }
    };

    /** [GET] /category/product/:id/edit */
    async editProduct(req, res) {
        try {
            const categoryProduct = await CategoryProduct.findById(req.params.id);
            if (!categoryProduct) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục' });
            }
            res.status(200).json({ data: { categoryProduct } });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [PUT] /category/product/:id */
    async updateProduct(req, res) {
        try {
            const { name, description } = req.body;
            const slug = createSlug(name);
            const r = await CategoryProduct.updateOne(
                { _id: req.params.id },
                { name, description, slug }
            );
            if (r.matchedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục' });
            }
            res.status(200).json({ message: 'Thành công' });
        } catch (err) {
            res.status(500).json({ message: 'Thất bại', error: err.message });
        }
    }

    /** [DELETE] /category/product/:id */
    async destroyProduct(req, res) {
        try {
            const r = await CategoryProduct.deleteOne({ _id: req.params.id });
            if (r.deletedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục' });
            }
            res.status(200).json({ message: 'Thành công' });
        } catch (err) {
            res.status(500).json({ message: 'Thất bại', error: err.message });
        }
    }

    /** [GET] /category/product/all — public */
    async getCategoryProduct(req, res) {
        try {
            const { limit, skip, page, sort } = parseListQuery(req.query, {
                allowedSortFields: SORT_CATEGORY,
                defaultSortField: 'name',
                defaultOrder: 'asc',
                defaultLimit: 100,
            });

            const [category, total] = await Promise.all([
                CategoryProduct.find({}).sort(sort).skip(skip).limit(limit).lean(),
                CategoryProduct.countDocuments({}),
            ]);

            res.status(200).json({
                category,
                total,
                totalPage: Math.max(1, Math.ceil(total / limit)),
                page,
                limit,
                offset: skip,
            });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [GET] /category/product/:slug — public */
    async getProductCategory(req, res, next) {
        try {
            const { slug } = req.params;

            const category = await CategoryProduct.findOne({ slug });
            if (!category) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục' });
            }

            const { limit, skip, page, sort } = parseListQuery(req.query, {
                allowedSortFields: SORT_PRODUCT,
                defaultSortField: 'createdAt',
                defaultOrder: 'desc',
                defaultLimit: 24,
            });

            const filter = { category: category._id };
            const [products, total] = await Promise.all([
                Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                Product.countDocuments(filter),
            ]);

            res.status(200).json({
                category,
                products,
                total,
                totalPage: Math.max(1, Math.ceil(total / limit)),
                page,
                limit,
                offset: skip,
            });
        } catch (error) {
            next(error);
        }
    }

    /** ===== DISCOUNT ===== */

    /** [GET] /category/discount — staff */
    async discount(req, res, next) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_DISCOUNT,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const filter = search ? { title: { $regex: search, $options: 'i' } } : {};

            const [discounts, total] = await Promise.all([
                Discount.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                Discount.countDocuments(filter),
            ]);

            const formatDiscount = discounts.map((d) => ({
                ...d,
                startDate: formatDate(d.start_date),
                endDate: formatDate(d.end_date),
                lastUpdate: formatDate(d.updatedAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                data: {
                    searchType: Boolean(search),
                    searchDiscount: search ? formatDiscount : undefined,
                    formatDiscount,
                    total,
                    totalPage,
                    page,
                    limit,
                    offset: skip,
                    currentSort: sortField,
                    currentOrder: orderLabel,
                },
            });
        } catch (err) {
            next(err);
        }
    }

    /** [POST] /category/discount/store */
    storeDiscount = async (req, res) => {
        try {
            const {
                title,
                description,
                discount_type,
                value_discount,
                end_date,
                apply_product,
                minimum_purchase,
                use_limit,
                use_count,
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
                use_count,
            });

            await discount.save();
            res.status(200).json({
                message: 'Thêm voucher thành công!',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    };

    /** [GET] /category/discount/:id/edit */
    async editDiscount(req, res) {
        try {
            const discounts = await Discount.findById(req.params.id);
            if (!discounts) {
                return res.status(404).json({ message: 'Không tìm thấy voucher' });
            }
            const discount = {
                ...discounts.toObject(),
                endDate: importDate(discounts.end_date),
                startDate: importDate(discounts.start_date),
            };
            res.status(200).json({ data: { discount } });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [PUT] /category/discount/:id */
    async updateDiscount(req, res) {
        try {
            const discountId = req.params.id;
            const updateData = { ...req.body };

            if (updateData.end_date) {
                const endDate = new Date(updateData.end_date);
                const now = new Date();
                if (endDate > now) {
                    updateData.is_active = 'active';
                } else {
                    updateData.is_active = 'stop';
                }
            }
            const updatedDiscount = await Discount.findByIdAndUpdate(discountId, updateData, {
                new: true,
            });

            if (!updatedDiscount) {
                return res.status(404).json({
                    message: 'Không tìm thấy voucher!',
                });
            }

            if (
                updatedDiscount.use_count >= updatedDiscount.use_limit &&
                updatedDiscount.is_active === 'active'
            ) {
                updatedDiscount.is_active = 'stop';
                await updatedDiscount.save();
            }
            res.status(200).json({
                message: 'Cập nhật voucher thành công!',
                discount: updatedDiscount,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
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
                    message: 'Voucher không tồn tại',
                });
            }

            res.status(200).json({
                message: 'Xóa voucher thành công!',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [GET] /category/discount/filter — staff */
    async filterDiscount(req, res) {
        try {
            const { is_active, endDate, startDate, timkiem, q } = req.query;
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                { ...req.query, timkiem: timkiem || q },
                {
                    allowedSortFields: SORT_DISCOUNT,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const query = {};
            if (is_active) {
                query.is_active = is_active;
            }
            if (endDate && startDate) {
                query.start_date = { $gte: new Date(startDate) };
                query.end_date = { $lte: new Date(endDate) };
            }
            if (search) {
                query.title = { $regex: search, $options: 'i' };
            }

            const [discounts, total] = await Promise.all([
                Discount.find(query).sort(sort).skip(skip).limit(limit).lean(),
                Discount.countDocuments(query),
            ]);

            const formatType = discounts.map((type) => ({
                ...type,
                endDate: formatDate(type.end_date),
                startDate: formatDate(type.start_date),
                lastUpdate: formatDate(type.updatedAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));
            res.status(200).json({
                formatDiscount: formatType,
                total,
                totalPage,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentOrder: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** ===== BANNER ===== */

    /** [GET] /category/banner — public */
    banner = async (req, res, next) => {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_BANNER,
                    defaultSortField: 'name',
                    defaultOrder: 'asc',
                    defaultLimit: 10,
                }
            );

            const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

            const [rows, total] = await Promise.all([
                Banner.find(filter).populate('discount').sort(sort).skip(skip).limit(limit).lean(),
                Banner.countDocuments(filter),
            ]);

            const formatBanner = rows.map((ban) => ({
                ...ban,
                lastUpdate: formatDate(ban.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                data: {
                    searchType: Boolean(search),
                    searchBanner: search ? formatBanner : undefined,
                    formatBanner,
                    total,
                    totalPage,
                    page,
                    limit,
                    offset: skip,
                    currentSort: sortField,
                    currentOrder: orderLabel,
                },
            });
        } catch (err) {
            next(err);
        }
    };

    /** [POST] /category/banner/store */
    storeBanner = async (req, res) => {
        try {
            const { name, thumbnail, thumbnail_1, content, status, disocunt } = req.body;
            const slug = createSlug(name);
            const banner = new Banner({
                name,
                thumbnail,
                thumbnail_1,
                content,
                status,
                disocunt,
                slug,
            });
            await banner.save();
            res.status(200).json({
                message: 'Thêm banner thành công!',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    };

    /** [GET] /category/banner/:id */
    async editBanner(req, res) {
        try {
            const banner = await Banner.findById(req.params.id);
            if (!banner) {
                return res.status(404).json({ message: 'Không tìm thấy banner' });
            }
            res.status(200).json({ data: { banner: mongooseToObject(banner) } });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [PUT] /category/banner/:id */
    async updateBanner(req, res) {
        try {
            const { name, ...rest } = req.body;
            const slug = createSlug(name);
            const r = await Banner.updateOne({ _id: req.params.id }, { ...rest, name, slug });
            if (r.matchedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy banner' });
            }
            res.status(200).json({
                message: 'Cập nhật banner thành công!',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** [DELETE] /category/banner/:id */
    async destroyBanner(req, res, next) {
        try {
            const r = await Banner.deleteOne({ _id: req.params.id });
            if (r.deletedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy banner' });
            }
            res.status(200).json({ message: 'Xóa banner thành công' });
        } catch (err) {
            next(err);
        }
    }

    /** [GET] /category/banner/filter — staff */
    async filterBanner(req, res) {
        try {
            const { status, startDate, endDate, timkiem, q } = req.query;
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                { ...req.query, timkiem: timkiem || q },
                {
                    allowedSortFields: SORT_BANNER,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const query = {};
            if (status) {
                query.status = status;
            }
            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }
            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }

            const [banners, total] = await Promise.all([
                Banner.find(query).sort(sort).skip(skip).limit(limit).lean(),
                Banner.countDocuments(query),
            ]);

            const bannerFormat = banners.map((v) => ({
                ...v,
                lastUpdate: formatDate(v.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));
            res.status(200).json({
                bannerFormat,
                total,
                totalPage,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentOrder: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }

    /** ==== VIDEO ==== */

    /** [GET] /category/video — public */
    async getCategoryVideo(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: SORT_VIDEO,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

            const [rows, total] = await Promise.all([
                Video.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                Video.countDocuments(filter),
            ]);

            const formatType = rows.map((type) => ({
                ...type,
                lastUpdate: formatDate(type.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                data: {
                    searchType: Boolean(search),
                    searchVideo: search ? formatType : undefined,
                    categoryVideo: formatType,
                    total,
                    totalPage,
                    page,
                    limit,
                    offset: skip,
                    currentSort: sortField,
                    currentOrder: orderLabel,
                },
            });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Lỗi server' });
        }
    }

    /** [POST] /category/video/store */
    async addCategoryVideo(req, res) {
        try {
            let { name, content, thumbnail, video_url, status } = req.body;
            if (!status || status === '') {
                status = 'public';
            }
            const slug = createSlug(name);
            const video = new Video({
                name,
                content,
                thumbnail,
                video_url,
                status,
                slug,
            });
            await video.save();
            res.status(200).json({ message: 'Thêm video thành công!' });
        } catch (err) {
            res.status(500).json({ message: 'Lỗi server vui lòng thử lại sau' });
        }
    }

    /** [GET] /category/video/:id/edit */
    async editVideo(req, res) {
        try {
            const video = await Video.findById(req.params.id);
            if (!video) {
                return res.status(404).json({ message: 'Không tìm thấy video' });
            }
            res.status(200).json({ video });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [GET] /category/video/:slug — public */
    async getDetailVideo(req, res) {
        try {
            const video = await Video.findOne({ slug: req.params.slug });
            if (!video) {
                return res.status(404).json({ message: 'Không tìm thấy video' });
            }

            const sideLimit = Math.min(clampLimit(req.query.limit_sidebar, 4), 20);
            const videosListLimit = Math.min(clampLimit(req.query.limit_videos, 30), 50);

            const format = {
                ...video.toObject(),
                formateDate: formatDate(video.createdAt),
            };

            const articles = await Article.find().sort({ createdAt: -1 }).limit(sideLimit).lean();
            const formNewArticles = articles.map((type) => ({
                ...type,
                formatedDate: formatDate(type.updatedAt),
            }));

            const product = await Product.find().sort({ createdAt: -1 }).limit(sideLimit).lean();
            const formNewProduct = product.map((type) => ({
                ...type,
                formatedDate: formatDate(type.createdAt),
            }));

            const videoAll = await Video.find({})
                .sort({ createdAt: -1 })
                .limit(videosListLimit)
                .lean();
            const formatVideo = videoAll.map((item) => ({
                ...item,
                format: formatDate(item.createdAt),
            }));

            res.status(200).json({
                data: {
                    video: format,
                    videos: formatVideo,
                    articleSuggest: formNewArticles,
                    productSuggest: formNewProduct,
                    limit_sidebar: sideLimit,
                    limit_videos: videosListLimit,
                },
            });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [PUT] /category/video/:id */
    async updateVideo(req, res) {
        try {
            const { name, content, thumbnail, video_url, status } = req.body;
            const slug = createSlug(name);
            const r = await Video.updateOne(
                { _id: req.params.id },
                {
                    name,
                    content,
                    thumbnail,
                    video_url,
                    status,
                    slug,
                }
            );
            if (r.matchedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy video' });
            }
            res.status(200).json({ message: 'Cập nhật video thành công!' });
        } catch (err) {
            res.status(500).json({ message: 'Thất bại', error: err.message });
        }
    }

    /** [GET] /category/video/filter — staff */
    async filterVideo(req, res) {
        try {
            const { status, startDate, endDate, timkiem, q } = req.query;
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                { ...req.query, timkiem: timkiem || q },
                {
                    allowedSortFields: SORT_VIDEO,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 10,
                }
            );

            const query = {};
            if (status) {
                query.status = status;
            }
            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }
            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }

            const [videos, total] = await Promise.all([
                Video.find(query).sort(sort).skip(skip).limit(limit).lean(),
                Video.countDocuments(query),
            ]);

            const videoFormat = videos.map((v) => ({
                ...v,
                lastUpdate: formatDate(v.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));
            res.status(200).json({
                videoFormat,
                total,
                totalPage,
                page,
                limit,
                offset: skip,
                currentSort: sortField,
                currentOrder: orderLabel,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau',
            });
        }
    }
}

module.exports = new CategoryController();
