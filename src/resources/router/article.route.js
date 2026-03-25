const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();

const articleController = require('../app/controller/article.controller');
const middleware = require('../app/controller/middleware.controller');

const articleReadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_ARTICLE_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

route.get('/fe/:slug', articleReadLimiter, articleController.getdetailproduct);
route.get('/api/latest', articleReadLimiter, articleController.getArticleLatest);

route.post('/store', middleware.verifyTokenStaff, articleController.store);
route.put('/:id', middleware.verifyTokenStaff, articleController.update);
route.delete('/:id', middleware.verifyTokenStaff, articleController.delete);
route.get(
    '/admin',
    middleware.verifyTokenStaff,
    articleReadLimiter,
    articleController.getArticleAdmin
);
route.get(
    '/filter',
    middleware.verifyTokenStaff,
    articleReadLimiter,
    articleController.filterArticle
);
route.get('/:id', middleware.verifyTokenStaff, articleReadLimiter, articleController.edit);
route.get('/add', middleware.verifyTokenStaff, articleReadLimiter, articleController.add);
route.get('/', middleware.verifyTokenStaff, articleReadLimiter, articleController.index);

module.exports = route;