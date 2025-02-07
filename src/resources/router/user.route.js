const express = require('express');
const route = express.Router();

const userController = require('../app/controller/user.controller');

route.delete('/:id', userController.delete);
route.post('/store', userController.store);
route.put('/:id', userController.update);
route.get('/:id/edit', userController.edit);
route.get('/add', userController.add);
route.get('/', userController.index);

module.exports = route;