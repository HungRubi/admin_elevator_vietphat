const Article = require('../model/article.model');
const { formatDate } = require('../../util/formatDate.util');
const { createSlug } = require('../../util/createSlug.util');
const { importDate } = require('../../util/importDate.util');
const { parseListQuery, clampLimit } = require('../../util/listQuery.util');
const Product = require('../model/products.model');

function dateEnglish(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
}

const ADMIN_SORT_FIELDS = ['subject', 'createdAt', 'updatedAt', 'status', 'author'];
const PUBLIC_SORT_FIELDS = ['createdAt', 'updatedAt', 'subject'];
const FILTER_SORT_FIELDS = ['subject', 'createdAt', 'updatedAt', 'status', 'author'];

class ArticleController {
    /** [GET] /articles — bài public, phân trang + tìm kiếm */
    async index(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: PUBLIC_SORT_FIELDS,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 8,
                }
            );

            const filter = { status: 'public' };
            if (search) {
                filter.$or = [
                    { subject: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } },
                ];
            }

            const [articles, total] = await Promise.all([
                Article.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                Article.countDocuments(filter),
            ]);

            const formatArticle = articles.map((article) => ({
                ...article,
                dateFormat: formatDate(article.updatedAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                data: {
                    articles: formatArticle,
                    total,
                    totalPage,
                    page,
                    limit,
                    offset: skip,
                    currentSort: sortField,
                    currentOrder: orderLabel,
                    search: search || null,
                },
            });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [GET] /articles/admin */
    async getArticleAdmin(req, res) {
        try {
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                req.query,
                {
                    allowedSortFields: ADMIN_SORT_FIELDS,
                    defaultSortField: 'subject',
                    defaultOrder: 'desc',
                    defaultLimit: 5,
                }
            );

            const filter = search ? { subject: { $regex: search, $options: 'i' } } : {};

            const [articles, total] = await Promise.all([
                Article.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                Article.countDocuments(filter),
            ]);

            const articleFormat = articles.map((p) => ({
                ...p,
                formatDate: importDate(p.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            return res.status(200).json({
                total,
                totalPage,
                page,
                limit,
                offset: skip,
                articleFormat,
                searchType: Boolean(search),
                searchArticle: search ? articleFormat : undefined,
                currentSort: sortField,
                currentArticle: orderLabel,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau :((',
            });
        }
    }

    /* [GET] /article/add */
    add(req, res) {
        res.render('articles/addArticle');
    }

    /** [POST] /articles/store */
    store = async (req, res) => {
        try {
            const {
                subject,
                content,
                author,
                status,
                thumbnail,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
            } = req.body;
            const slug = createSlug(subject);

            const article = new Article({
                subject,
                content,
                author,
                status,
                thumbnail,
                slug,
                thumbnail_1,
                thumbnail_2,
                thumbnail_3,
            });
            await article.save();
            res.status(200).json({
                message: 'Thêm bài viết thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau :((',
            });
        }
    };

    /** [GET] /articles/:id */
    async edit(req, res) {
        try {
            const article = await Article.findById(req.params.id);
            if (!article) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết' });
            }
            const formatProduct = {
                ...article.toObject(),
                lastUpdate: importDate(article.updatedAt),
            };
            res.status(200).json({ data: { article: formatProduct } });
        } catch (err) {
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [PUT] /articles/:id */
    async update(req, res) {
        try {
            const updateData = { ...req.body };

            if (updateData.subject) {
                updateData.slug = createSlug(updateData.subject);
            }

            const result = await Article.updateOne({ _id: req.params.id }, updateData);
            if (result.matchedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết' });
            }

            res.status(200).json({
                message: 'Cập nhật bài viết thành công!',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi server vui lòng thử lại sau :((',
            });
        }
    }

    /** [DELETE] /articles/:id */
    async delete(req, res) {
        try {
            const result = await Article.deleteOne({ _id: req.params.id });
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết' });
            }
            res.status(200).json({
                message: 'Xóa bài viết thành công',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Lỗi hệ thống vui lòng thử lại sau',
            });
        }
    }

    /** [GET] /articles/fe/:slug */
    async getdetailproduct(req, res) {
        try {
            const article = await Article.findOne({ slug: req.params.slug });
            if (!article) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết' });
            }

            const sideLimit = clampLimit(req.query.limit_sidebar, 4);
            const cappedSide = Math.min(sideLimit, 20);

            const formatarticle = {
                ...article.toObject(),
                formatedDate: formatDate(article.updatedAt),
            };

            const articles = await Article.find().sort({ createdAt: -1 }).limit(cappedSide);
            const formNewArticles = articles.map((type) => ({
                ...type.toObject(),
                formatedDate: formatDate(type.updatedAt),
            }));

            const product = await Product.find().sort({ createdAt: -1 }).limit(cappedSide);
            const formNewProduct = product.map((type) => ({
                ...type.toObject(),
                formatedDate: formatDate(type.createdAt),
            }));

            res.status(200).json({
                article: formatarticle,
                formNewProduct,
                formNewArticles,
                limit_sidebar: cappedSide,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message || 'Lỗi server' });
        }
    }

    /** [GET] /articles/api/latest */
    getArticleLatest = async (req, res) => {
        try {
            const lim = clampLimit(req.query.limit, 2);
            const capped = Math.min(lim, 20);

            const latestarticles = await Article.find()
                .sort({ createdAt: -1 })
                .limit(capped);
            const formatarticle = latestarticles.map((cus) => ({
                ...cus.toObject(),
                formatedDate: dateEnglish(cus.createdAt),
            }));
            res.json(formatarticle);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi lấy bài viết mới nhất', error: error.message });
        }
    };

    /** [GET] /articles/filter */
    async filterArticle(req, res) {
        try {
            const { status, startDate, endDate, timkiem, q } = req.query;
            const { limit, skip, page, sort, sortField, orderLabel, search } = parseListQuery(
                { ...req.query, timkiem: timkiem || q },
                {
                    allowedSortFields: FILTER_SORT_FIELDS,
                    defaultSortField: 'createdAt',
                    defaultOrder: 'desc',
                    defaultLimit: 5,
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
                query.subject = { $regex: search, $options: 'i' };
            }

            const [raw, total] = await Promise.all([
                Article.find(query).sort(sort).skip(skip).limit(limit).lean(),
                Article.countDocuments(query),
            ]);

            const formatArticle = raw.map((a) => ({
                ...a,
                formatDate: formatDate(a.createdAt),
            }));

            const totalPage = Math.max(1, Math.ceil(total / limit));

            res.status(200).json({
                formatArticle,
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
                message: 'Lỗi server vui lòng thử lại sau :((',
            });
        }
    }
}

module.exports = new ArticleController();
