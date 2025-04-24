const express = require('express');
const route = express.Router();

const articleController = require('../app/controller/article.controller');

route.get('/fe/:slug', articleController.getdetailproduct);
route.get('/api/latest', articleController.getArticleLatest);

route.post('/store', articleController.store);
route.put('/:id', articleController.update);
route.delete('/:id', articleController.delete);
route.get('/admin', articleController.getArticleAdmin);
route.get('/filter', articleController.filterArticle);
route.get('/:id', articleController.edit);
route.get('/add', articleController.add);
route.get('/', articleController.index);

module.exports = route;