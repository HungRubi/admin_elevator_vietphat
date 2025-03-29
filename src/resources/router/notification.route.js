const express = require('express');
const route = express.Router();

const notificationController = require('../app/controller/notification.controller');

route.post('/add', notificationController.addNotification);
route.get('/', notificationController.getNotification);


module.exports = route