const Article = require('../model/article.model');
const Product = require('../model/products.model');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util');
const { createSlug } = require('../../util/createSlug.util');
const { importDate } = require('../../util/importDate.util');

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
            res.status(500).json({message: err});
        }
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