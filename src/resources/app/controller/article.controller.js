const Article = require('../model/article.model');
const { mutipleMongooseoObject } = require('../../util/mongoose.util');
const { mongooseToObject } = require('../../util/mongoose.util');
const { formatDate } = require('../../util/formatDate.util');
const { createSlug } = require('../../util/createSlug.util')
class CustomersController {
    
    /* [GET] /articles */
    index(req, res, next) {
        Article.find()
        .then(articles => {
            const formatarticle = articles.map(cus => {
                return{
                    ...cus.toObject(),
                    formatedDate: formatDate(cus.updatedAt),
                }
            })
            res.render('articles/articles', {
                articles: formatarticle,
            });
        })
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
    
    /** [GET] /articles/:id/edit */
    edit(req, res, next) {
        Article.findById(req.params.id)
            .then(articles => {
                res.render('articles/editArticle',{
                    articles: mongooseToObject(articles),
                })
            })
    }

    /** [PUT] /article/:id */
    update(req, res, next) {
        Article.updateOne({_id: req.params.id}, req.body)
        .then(() => {
            res.redirect('/articles');
        })
        .catch(next);
    }

    /** [DELETE] /article/:id */
    delete(req, res, next) {
        Article.deleteOne({_id: req.params.id})
        .then(() => {res.redirect('back')})
        .catch(next)
    }
}

module.exports = new CustomersController();