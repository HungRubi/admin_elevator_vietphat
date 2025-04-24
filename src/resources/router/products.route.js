const express = require('express');
const route = express.Router();

const productsController = require('../app/controller/products.controller');

route.post('/selected', productsController.getProductSelected);
route.get('/fe/:slug', productsController.getProductEditFe);
route.post('/store', productsController.store);
route.delete('/:id', productsController.destroyProduct);
route.get('/admin', productsController.index);
route.get('/filter', productsController.filterProduct);
route.put('/:id', productsController.updateProduct);
route.get('/:id', productsController.getProductEdit);
route.get('/', productsController.getProduct);

module.exports = route;