const express = require('express');
const route = express.Router();

const ordersController = require('../app/controller/orders.controller');

route.post('/store', ordersController.store);

route.get('/add', ordersController.add);
route.get('/', ordersController.index);

module.exports = route;