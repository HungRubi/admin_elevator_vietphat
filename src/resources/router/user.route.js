const express = require('express');
const route = express.Router();

const userController = require('../app/controller/user.controller');

route.get('/api/count', userController.getCustomersLast7Days);

route.delete('/:id', userController.delete);
route.post('/store', userController.store);
route.post('/cart/:id/store', userController.storeCart);
route.put('/:id', userController.update);
route.get('/:id/edit', userController.edit);
route.get('/cart/:id', userController.getCart);
route.get('/add', userController.add);
route.get('/', userController.index);

module.exports = route;