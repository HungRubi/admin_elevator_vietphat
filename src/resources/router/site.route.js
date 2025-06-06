const express = require('express');
const route = express.Router();

const siteController = require('../app/controller/site.controller');

route.post('/create-payment-url', siteController.createPaymentUrl);
route.get('/vnpay/return', siteController.getVnPayReturn);
route.get('/check_payment', siteController.getVnPayCheckOut);
route.get('/home', siteController.getHome);
route.get('/timkiem', siteController.querySearch);

module.exports = route;