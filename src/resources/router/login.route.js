const express = require('express');
const route = express.Router();

const loginController = require('../app/controller/login.controller');

route.get('/api/employee/infor', loginController.getEmployee);

route.post('/store', loginController.login);
route.get('/', loginController.index);

module.exports = route;