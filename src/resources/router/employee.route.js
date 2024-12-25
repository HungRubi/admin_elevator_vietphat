const express = require('express');
const route = express.Router();

const employeeController = require('../app/controller/employee.controller');

route.get('/', employeeController.index);

module.exports = route;