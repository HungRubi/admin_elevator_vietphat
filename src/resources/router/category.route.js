const express = require('express');
const route = express.Router();

const categoryController = require('../app/controller/category.controller');

/** === PRODUCT === */
route.get('/product', categoryController.product);
route.get('/product/:id/edit', categoryController.editProduct);
route.get('/product/add', categoryController.addProduct);
route.post('/product/store', categoryController.storeProduct);

/** === DISCOUNT === */
route.post('/discount/store',categoryController.storeDiscount);
route.get('/discount/add', categoryController.addDiscount);
route.get('/discount', categoryController.discount);

module.exports = route;