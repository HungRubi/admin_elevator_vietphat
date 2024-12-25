const express = require('express');
const route = express.Router();

const productsController = require('../app/controller/products.controller');

route.get('/', productsController.index);

module.exports = route;