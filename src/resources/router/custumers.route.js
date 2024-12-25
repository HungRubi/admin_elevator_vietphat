const express = require('express');
const route = express.Router();

const custumersController = require('../app/controller/custumers.controller');

route.get('/', custumersController.index);

module.exports = route;