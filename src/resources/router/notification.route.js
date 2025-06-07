const express = require('express');
const route = express.Router();

const notificationController = require('../app/controller/notification.controller');

route.put('/read/:id', notificationController.isReadNotification);
route.get('/all/:id', notificationController.getAllNotifiByUser);
route.post('/add', notificationController.addNotification);
route.get('/filter', notificationController.filterNotification);
route.get('/:id', notificationController.editNotification);
route.put('/:id', notificationController.updateNotification);
route.delete('/:id', notificationController.deleteNotification);
route.get('/', notificationController.getNotification);

module.exports = route