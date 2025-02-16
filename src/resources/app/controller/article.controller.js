const Article = require('../model/article.model');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util');
const { createSlug } = require('../../util/createSlug.util')

function dateEnglish(date) {
    return new Date(date).toLocaleDateString('en-US', {  
        month: 'short', day: '2-digit', year: 'numeric'  
    });
}
class ArticleController {
    
    /* [GET] /admin/articles */
    async index(req, res, next) {
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let skip = (page - 1) * limit;
        let sortField = req.query.sort || 'subject'; 
        let sortOrder = req.query.order === 'desc' ? -1 : 1; 
        try{
            const searchQuery = req.query.timkiem?.trim() || '';
            if (searchQuery) {
                const articles = await Article.find({
                    subject: { $regex: searchQuery, $options: 'i' }
                }).sort({ [sortField]: sortOrder }).lean();
    
                const formatArticle = articles.map(article => ({
                    ...article,
                    lastUpdate: formatDate(article.updatedAt)
                }));
    
                return res.render('articles/articles', {
                    searchType: true,
                    searchArticle: formatArticle,
                    searchQuery,
                    currentSort: sortField,
                    currentOrder: sortOrder === 1 ? 'asc' : 'desc'
                });
            } 
    
            const articles = await Article.find()
                .skip(skip)
                .limit(limit)
                .sort({ [sortField]: sortOrder }) // Sắp xếp sản phẩm
                .lean();
    
            const formatArticleMain = articles.map(article => ({
                ...article,
                dateFormat: formatDate(article.updatedAt)
            }));
    
            const totalArticle = await Article.countDocuments();
            const totalPage = Math.ceil(totalArticle / limit);
    
            res.render('articles/articles', {
                formatArticleMain,
                currentPage: page,
                totalPage,
                searchType: false,
                currentSort: sortField,
                currentOrder: sortOrder === 1 ? 'asc' : 'desc'
            });
        }catch(err){
            next(err);
        }
    }

    /* [GET] /admin/article/add */
    add(req, res, next) {
        res.render('articles/addArticle')
    }

    /** [POST] /admin/articles/store */
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
                thumbnail_4,
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
                thumbnail_4,
            });
            await article.save();
            res.redirect('/articles');
        }
        catch(error){
            next(error);
        }
    }
    
    /** [GET] /admin/articles/:id/edit */
    edit(req, res, next) {
        Article.findById(req.params.id)
            .then(articles => {
                res.render('articles/editArticle',{
                    articles: mongooseToObject(articles),
                })
            })
    }

    /** [PUT] /admin/articles/:id */
    update(req, res, next) {
        Article.updateOne({_id: req.params.id}, req.body)
        .then(() => {
            res.redirect('/articles');
        })
        .catch(next);
    }

    /** [DELETE] /admin/articles/:id */
    delete(req, res, next) {
        Article.deleteOne({_id: req.params.id})
        .then(() => {res.redirect('/articles')})
        .catch(next)
    }

    /** [GET] /admin/articles/getall */
    getAll(req, res, next) {
        
        Article.find({status : 'public'})
        .then(articles => {
            const formatarticle = articles.map(cus => {
                return{
                    ...cus.toObject(),
                    formatedDate: formatDate(cus.updatedAt),
                }
            })
            res.json(formatarticle)
        })
        .catch(next);
    }

    /** [GET] /admin/articles/getdetail/:slug */
    getdetailproduct(req, res, next){
        Article.findOne({ slug: req.params.slug })
            .then((article) => {
                const formatarticle = {
                    ...article.toObject(),
                    formatedDate: formatDate(article.updatedAt),
                };
                res.json(formatarticle);
            })
            .catch(next);
    }

    /** [GET] /admin/articles/api/latest */
    getArticleLatest = async(req, res, next) => {
        try {
            const latestProducts = await Article.find().sort({ createdAt: -1 }).limit(2);
            const formatarticle = latestProducts.map(cus => {
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
}

module.exports = new ArticleController();