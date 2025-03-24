const express = require('express');
const route = express.Router();

const middlewareController = require('../app/controller/middleware.controller');
const productsController = require('../app/controller/products.controller');

route.get('/fe/:slug', productsController.getProductEditFe);
route.get('/:id', middlewareController.verifyTokenAdmin ,productsController.getProductEdit);
route.get('/', middlewareController.verifyToken ,productsController.getProduct);

module.exports = route;