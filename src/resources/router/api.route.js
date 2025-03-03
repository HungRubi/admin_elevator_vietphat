const express = require('express');
const route = express.Router();

const apiController = require('../app/controller/api.controller');

route.get('/home', apiController.getHome);

module.exports = route;