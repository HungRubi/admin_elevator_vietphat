const express = require('express');
const route = express.Router();

const productsController = require('../app/controller/products.controller');

route.post('/selected', productsController.getProductSelected);
route.get('/fe/:slug', productsController.getProductEditFe);
route.get('/:id', productsController.getProductEdit);
route.get('/', productsController.getProduct);

module.exports = route;