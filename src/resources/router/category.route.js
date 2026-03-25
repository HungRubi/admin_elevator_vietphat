const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();

const categoryController = require('../app/controller/category.controller');
const middleware = require('../app/controller/middleware.controller');

const categoryPublicLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_CATEGORY_PUBLIC_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

/** === PRODUCT === (đọc công khai: danh mục / chi tiết theo slug) */
route.get(
    '/product/get-product/:id',
    categoryPublicLimiter,
    categoryController.getProductByCategory
);
route.get('/product/all', categoryPublicLimiter, categoryController.getCategoryProduct);
route.get('/product/:id/edit', middleware.verifyTokenStaff, categoryController.editProduct);
route.post('/product/store', middleware.verifyTokenStaff, categoryController.storeProduct);
route.get('/product/:slug', categoryPublicLimiter, categoryController.getProductCategory);
route.put('/product/:id', middleware.verifyTokenStaff, categoryController.updateProduct);
route.delete('/product/:id', middleware.verifyTokenStaff, categoryController.destroyProduct);
route.get('/product', middleware.verifyTokenStaff, categoryController.product);

/** === DISCOUNT === */
route.post('/discount/store', middleware.verifyTokenStaff, categoryController.storeDiscount);
route.get('/discount/filter', middleware.verifyTokenStaff, categoryController.filterDiscount);
route.delete('/discount/:id', middleware.verifyTokenStaff, categoryController.deleteDiscount);
route.put('/discount/:id', middleware.verifyTokenStaff, categoryController.updateDiscount);
route.get('/discount/:id', middleware.verifyTokenStaff, categoryController.editDiscount);
route.get('/discount', middleware.verifyTokenStaff, categoryController.discount);

/** === BANNER === */
route.put('/banner/:id', middleware.verifyTokenStaff, categoryController.updateBanner);
route.get('/banner/filter', middleware.verifyTokenStaff, categoryController.filterBanner);
route.get('/banner/:id', middleware.verifyTokenStaff, categoryController.editBanner);
route.post('/banner/store', middleware.verifyTokenStaff, categoryController.storeBanner);
route.get('/banner', categoryPublicLimiter, categoryController.banner);

/** === VIDEO === */
route.get('/video/filter', middleware.verifyTokenStaff, categoryController.filterVideo);
route.put('/video/:id', middleware.verifyTokenStaff, categoryController.updateVideo);
route.get('/video/:id/edit', middleware.verifyTokenStaff, categoryController.editVideo);
route.get('/video/:slug', categoryPublicLimiter, categoryController.getDetailVideo);
route.post('/video/store', middleware.verifyTokenStaff, categoryController.addCategoryVideo);
route.get('/video', categoryPublicLimiter, categoryController.getCategoryVideo);

module.exports = route;
