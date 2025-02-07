const express = require('express');
const route = express.Router();

const categoryController = require('../app/controller/category.controller');

route.get('/product', categoryController.product)

module.exports = route;