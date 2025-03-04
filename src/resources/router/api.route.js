const express = require('express');
const route = express.Router();

const apiController = require('../app/controller/api.controller');

route.get('/home', apiController.getHome);
route.get('/products', apiController.getProduct);
route.get('/articles', apiController.getArticle);   

module.exports = route;