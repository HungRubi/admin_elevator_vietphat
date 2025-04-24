const Article = require('../model/article.model');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util');
const { createSlug } = require('../../util/createSlug.util');
const { importDate } = require('../../util/importDate.util');
const Product = require('../model/products.model')

function dateEnglish(date) {
    return new Date(date).toLocaleDateString('en-US', {  
        month: 'short', day: '2-digit', year: 'numeric'  
    });
}
class ArticleController {
    
    /* [GET] /articles */
    async index(req, res, next) {
        try {
            const articles = await Article.find({ status: 'public' })
                .sort({ createdAt: -1 })
                .lean();
    
            const formatArticle = articles.map(article => ({
                ...article,
                dateFormat: formatDate(article.updatedAt)
            }));
    
            const totalArticle = await Article.countDocuments();
            const totalPage = Math.ceil(totalArticle / 8);
            const data = {
                articles: formatArticle,
                totalPage,
            };
    
            res.status(200).json({ data });
        } catch (err) {
            res.status.json({message: err});
        }
    }

    /** [GET] /articles/admin */
    async getArticleAdmin(req, res, next) {
        let sortField = req.query.sort || 'subject'; 
        let sortArticle = req.query.article === 'desc' ? 1 : -1;
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if(searchQuery){
                const articles = await Article.find({
                    subject: { $regex: searchQuery, $options: 'i' }
                }).sort({ [sortField]: sortArticle }).lean();
                const articleFormat = articles.map(p => ({
                    ...p,
                    formatDate: importDate(p.createdAt)
                }))
                return res.status(200).json({
                    searchType: true,
                    searchArticle: articleFormat,
                    currentSort: sortField,
                    currentArticle: sortArticle === 1 ? 'asc' : 'desc',
                })
            }
            const articles = await Article.find()
                .sort({ [sortField]: sortArticle }) 
                .lean();
    
            const articleFormat = articles.map(p => ({
                ...p,
                formatDate: importDate(p.createdAt)
            }))

            const totalProduct = await Article.countDocuments();
            const totalPage = Math.ceil(totalProduct / 5);
    
            return res.status(200).json({
                totalPage,
                articleFormat,
                searchType: false,
                currentSort: sortField,
                currentArticle: sortArticle === 1 ? 'asc' : 'desc'
            });
        }catch(error){
            console.log(error);
            return res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau :(("
            })
        }
    }

    /* [GET] /article/add */
    add(req, res, next) {
        res.render('articles/addArticle')
    }

    /** [POST] /articles/store */
    store = async (req, res, next) => {
        try{
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
                message: "Thêm bài viết thành công",
            })
        }
        catch(error){
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau :(("
            });
        }
    }
    
    /** [GET] /articles/:id */
    async edit(req, res, next) {
        try{
            const article = await Article.findById(req.params.id)
            const formatProduct = {
                    ...article.toObject(),
                    lastUpdate: importDate(article.updatedAt)
            }
            const data = {
                article: formatProduct
            }
            res.status(200).json({data})
        }
        catch(err){
            res.status(500).json({message: err})
        }
    }

    /** [PUT] /articles/:id */
    async update(req, res, next) {
        try {
            const updateData = { ...req.body };
            
            // Chỉ tạo slug mới nếu subject được cập nhật
            if (updateData.subject) {
                updateData.slug = createSlug(updateData.subject);
            }
            
            await Article.updateOne({ _id: req.params.id }, updateData);
            
            res.status(200).json({
                message: "Cập nhật bài viết thành công!"
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau :(("
            });
        }
    }

    /** [DELETE] /articles/:id */
    delete(req, res, next) {
        Article.deleteOne({_id: req.params.id})
        .then(() => {res.status(200).json({
            message: "Xóa bài viết thành công",
        })})
        .catch(error => {
            console.log(error);
            res.status(500).json({
                message: "Lỗi hệ thống vui lòng thử lại sau"
            })
        })
    }

    /** [GET] /articles/fe/:slug */
    async getdetailproduct(req, res, next){
        try{
            const article = await  Article.findOne({ slug: req.params.slug });
            const formatarticle = {
                ...article.toObject(),
                formatedDate: formatDate(article.updatedAt),
            };
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
            res.status(200).json({
                article: formatarticle,
                formNewProduct,
                formNewArticles
            });
        }catch(err){
            console.log(err)
            res.status(500).json({message: err});
        }
    }

    /** [GET] /articles/api/latest */
    getArticleLatest = async(req, res, next) => {
        try {
            const latestarticles = await Article.find().sort({ createdAt: -1 }).limit(2);
            const formatarticle = latestarticles.map(cus => {
                return{
                    ...cus.toObject(),
                    formatedDate: dateEnglish(cus.createdAt),
                }
            })
            res.json(formatarticle);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi lấy sản phẩm mới nhất', error });
        }
    }

    /** [GET] /articles/filter */
    async filterArticle (req, res) {
        try{
            console.log(req.query)
            const {status, startDate, endDate} = req.query;
            let query = {};
            if(status){
                query.status = status;
            }
            if(startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                }
            }
            const articles = await Article.find(query).lean();
            const formatArticle = articles.map(a => ({
                ...a,
                formatDate: formatDate(a.createdAt)
            }))
            const totalPage = Math.ceil(articles.length / 5);
            res.status(200).json({
                formatArticle,
                totalPage
            })
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: "Lỗi server vui lòng thử lại sau :(("
            });
        }
    }
}

module.exports = new ArticleController();