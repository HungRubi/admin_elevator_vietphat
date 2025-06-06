const express = require('express');
const route = express.Router();

const authController = require('../app/controller/auth.controller');
const middlewareController = require('../app/controller/middleware.controller');
route.post('/login/admin' , authController.loginAdmin);
route.put('/password/:id' , authController.changePassword);
route.post('/login' , authController.login);
route.post('/register' , authController.register);
route.post('/refresh' , authController.requestRefreshToken);
route.post('/logout' , middlewareController.verifyToken ,authController.logout);

module.exports = route