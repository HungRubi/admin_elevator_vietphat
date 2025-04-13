const express = require('express');
const route = express.Router();

const userController = require('../app/controller/user.controller');

route.put('/update/address/:id', userController.updateAddress);   
route.get('/:id', userController.getUserDetail);   
route.get('/', userController.getUser);

module.exports = route;