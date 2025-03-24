const express = require('express');
const route = express.Router();

const categoryController = require('../app/controller/category.controller');

/** === PRODUCT === */
route.get('/product', categoryController.product);
route.get('/product/all', categoryController.getCategoryProduct);
route.get('/product/:slug', categoryController.getProductCategory);
route.get('/product/:id/edit', categoryController.editProduct);
route.post('/product/store', categoryController.storeProduct);
route.put('/product/:id', categoryController.updateProduct);
route.delete('/product/:id', categoryController.destroyProduct);

/** === DISCOUNT === */
route.post('/discount/store',categoryController.storeDiscount);
route.put('/discount/:id', categoryController.updateDiscount);
route.get('/discount/:id', categoryController.editDiscount);
route.get('/discount', categoryController.discount);

/** === BANNER === */
route.put('/banner/:id', categoryController.updateBanner);
route.get('/banner/:id', categoryController.editBanner);
route.post('/banner/store', categoryController.storeBanner);
route.get('/banner', categoryController.banner);

/** === VIDEO === */
route.put('/video/:id', categoryController.updateVideo);
route.get('/video/:id/edit', categoryController.editVideo);
route.get('/video/:slug', categoryController.getDetailVideo);
route.post('/video/store', categoryController.addCategoryVideo);
route.get('/video', categoryController.getCategoryVideo);

module.exports = route;