const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();

const siteController = require('../app/controller/site.controller');

const siteHomeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_SITE_HOME_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

const siteSearchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_SITE_SEARCH_PER_MINUTE || 60)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

const sitePaymentUrlLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_SITE_PAYMENT_URL_PER_MINUTE || 30)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

const siteVnpCallbackLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_SITE_VNP_CALLBACK_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

route.post('/create-payment-url', sitePaymentUrlLimiter, siteController.createPaymentUrl);
route.get('/vnpay/return', siteVnpCallbackLimiter, siteController.getVnPayReturn);
route.get('/check_payment', siteVnpCallbackLimiter, siteController.getVnPayCheckOut);
route.get('/home', siteHomeLimiter, siteController.getHome);
route.get('/timkiem', siteSearchLimiter, siteController.querySearch);

module.exports = route;
