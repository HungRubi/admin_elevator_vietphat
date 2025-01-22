const express = require('express');
const route = express.Router();

const reportController = require('../app/controller/report.controller');

route.get('/', reportController.index);

module.exports = route;