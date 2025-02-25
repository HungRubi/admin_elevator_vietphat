const express = require('express');
const route = express.Router();

const ordersController = require('../app/controller/orders.controller');

route.post('/store', ordersController.store);

route.get('/api/count', ordersController.getOrderLast7Days);
route.get('/details/:id', ordersController.details);
route.put('/:id', ordersController.update);
route.delete('/details/:id', ordersController.deleteDetails);
route.get('/:id/edit', ordersController.edit);
route.get('/add', ordersController.add);
route.get('/', ordersController.index);

module.exports = route;