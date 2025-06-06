 const express = require('express');
const route = express.Router();

const userController = require('../app/controller/user.controller');

route.put('/profile/update/:id',userController.updateProfileUser);   
route.put('/update/address/:id', userController.updateAddress);   
route.get('/order/:id', userController.getOrder);   
route.get('/new', userController.getNewUser);   
route.get('/filter', userController.filterUser);   
route.post('/store', userController.store);   
route.delete('/:id', userController.destroy);   
route.get('/:id', userController.getUserDetail);   
route.get('/', userController.getUser);

module.exports = route;