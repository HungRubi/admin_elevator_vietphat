const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();

const productsController = require('../app/controller/products.controller');
const middleware = require('../app/controller/middleware.controller');

const productsPublicLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_PRODUCTS_PUBLIC_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

const productsSelectedLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_PRODUCTS_SELECTED_PER_MINUTE || 60)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

route.get('/', productsPublicLimiter, productsController.getProduct);
route.get('/filter', productsPublicLimiter, productsController.filterProduct);
route.get('/fe/:slug', productsPublicLimiter, productsController.getProductEditFe);
route.post('/selected', productsSelectedLimiter, productsController.getProductSelected);
route.post('/store', middleware.verifyTokenStaff, productsController.store);
route.delete('/:id', middleware.verifyTokenStaff, productsController.destroyProduct);
route.get('/admin', middleware.verifyTokenStaff, productsController.index);
route.put('/:id', middleware.verifyTokenStaff, productsController.updateProduct);
route.get('/:id', middleware.verifyTokenStaff, productsController.getProductEdit);

module.exports = route;
