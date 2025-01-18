const express = require('express');
const route = express.Router();

const articleController = require('../app/controller/article.controller');

route.get('/getall', articleController.getAll);
route.get('/getdetail/:slug', articleController.getdetailproduct);


route.post('/store', articleController.store);
route.put('/:id', articleController.update);
route.delete('/:id', articleController.delete);
route.get('/:id/edit', articleController.edit);
route.get('/add', articleController.add);
route.get('/', articleController.index);

module.exports = route;