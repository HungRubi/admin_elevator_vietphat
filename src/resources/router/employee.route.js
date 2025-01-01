const express = require('express');
const route = express.Router();

const employeeController = require('../app/controller/employee.controller');

route.post('/store', employeeController.store);
route.put('/:id', employeeController.update);
route.get('/:id/edit', employeeController.edit);
route.get('/add', employeeController.add);
route.get('/', employeeController.index);

module.exports = route;