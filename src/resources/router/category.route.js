const express = require('express');
const route = express.Router();

const categoryController = require('../app/controller/category.controller');

/** === PRODUCT === */
route.get('/product', categoryController.product);
route.get('/product/all', categoryController.getCategoryProduct);
route.get('/product/:slug', categoryController.getCategoryProduct);
route.get('/product/:id/edit', categoryController.editProduct);
route.get('/product/add', categoryController.addProduct);
route.post('/product/store', categoryController.storeProduct);
route.put('/product/:id', categoryController.updateProduct);
route.delete('/product/:id', categoryController.destroyProduct);

/** === DISCOUNT === */
route.post('/discount/store',categoryController.storeDiscount);
route.get('/discount/add', categoryController.addDiscount);
route.get('/discount', categoryController.discount);

module.exports = route;