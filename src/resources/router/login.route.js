const express = require('express');
const route = express.Router();

const loginController = require('../app/controller/login.controller');

route.get('/api/user/infor', loginController.getUser);
route.get('/profile', loginController.profile);

route.post('/store', loginController.login);
route.get('/', loginController.index);

module.exports = route;