const express = require('express');
const route = express.Router();

const notificationController = require('../app/controller/notification.controller');

route.get('/:id', notificationController.editNotification);
route.put('/:id', notificationController.updateNotification);
route.delete('/:id', notificationController.deleteNotification);
route.post('/add', notificationController.addNotification);
route.get('/', notificationController.getNotification);


module.exports = route