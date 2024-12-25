const express = require('express');
const route = express.Router();

const productsController = require('../app/controller/products.controller');

route.post('/store', productsController.store);
route.get('/add', productsController.add);
route.get('/', productsController.index);

module.exports = route;