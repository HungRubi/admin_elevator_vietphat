const express = require('express');
const route = express.Router();

const categoryController = require('../app/controller/category.controller');

/** === PRODUCT === */
route.get('/product', categoryController.product);
route.get('/product/all', categoryController.getCategoryProduct);
route.get('/product/:slug', categoryController.getProductCategory);
route.get('/product/:id/edit', categoryController.editProduct);
route.get('/product/add', categoryController.addProduct);
route.post('/product/store', categoryController.storeProduct);
route.put('/product/:id', categoryController.updateProduct);
route.delete('/product/:id', categoryController.destroyProduct);

/** === DISCOUNT === */
route.post('/discount/store',categoryController.storeDiscount);
route.put('/discount/:id', categoryController.updateDiscount);
route.get('/discount/:id/edit', categoryController.editDiscount);
route.get('/discount/add', categoryController.addDiscount);
route.get('/discount', categoryController.discount);

/** === BANNER === */
route.put('/banner/:id', categoryController.updateBanner);
route.get('/banner/add', categoryController.addBanner);
route.get('/banner/:id/edit', categoryController.editBanner);
route.post('/banner/store', categoryController.storeBanner);
route.get('/banner', categoryController.banner);


module.exports = route;