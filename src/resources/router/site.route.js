const express = require('express');
const route = express.Router();

const siteController = require('../app/controller/site.controller');

route.get('/home', siteController.getHome);

module.exports = route;