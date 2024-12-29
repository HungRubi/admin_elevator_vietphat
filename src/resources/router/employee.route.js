const express = require('express');
const route = express.Router();

const employeeController = require('../app/controller/employee.controller');

route.post('/store', employeeController.store);
route.get('/add', employeeController.add);
route.get('/', employeeController.index);

module.exports = route;