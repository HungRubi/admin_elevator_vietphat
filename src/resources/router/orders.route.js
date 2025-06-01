const express = require('express');
const route = express.Router();

const ordersController = require('../app/controller/orders.controller');

route.get('/api/count', ordersController.getOrderLast7Days);
route.get('/details/:id', ordersController.details);
route.get('/discount-chart', ordersController.getOrderDiscount);
route.get('/monthly-chart', ordersController.getMonthlyRevenue);
route.get('/payment-chart', ordersController.getOrderDiscountSummary);
route.put('/admin/:id', ordersController.updateOrderAdmin);
route.post('/store', ordersController.store);
route.get('/filter', ordersController.filterOrders);
route.get('/add', ordersController.add);

// Các route động nên để cuối
route.put('/:id', ordersController.update);
route.delete('/:id', ordersController.deleteDetails);
route.get('/:id', ordersController.edit);
route.get('/', ordersController.index); 


module.exports = route;