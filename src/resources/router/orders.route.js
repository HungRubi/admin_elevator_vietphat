const express = require('express');
const route = express.Router();

const ordersController = require('../app/controller/orders.controller');
route.post('/store', ordersController.store);
route.get('/api/count', ordersController.getOrderLast7Days);
route.get('/details/:id', ordersController.details);
route.get('/filter', ordersController.filterOrders);
route.get('/discount-chart', ordersController.getOrderDiscount);
route.get('/monthly-chart', ordersController.getMonthlyRevenue);
route.get('/payment-chart', ordersController.getOrderDiscountSummary);
route.put('/:id', ordersController.update);
route.put('/admin/:id', ordersController.updateOrderAdmin);
route.delete('/:id', ordersController.deleteDetails);
route.get('/add', ordersController.add);
route.get('/:id', ordersController.edit);
route.get('/' ,ordersController.index);

module.exports = route;