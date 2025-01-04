const express = require('express');
const route = express.Router();

const custumersController = require('../app/controller/custumers.controller');

route.post('/store', custumersController.store);
route.get('/add', custumersController.add);
route.put('/:id', custumersController.update);
route.get('/:id/edit', custumersController.edit);
route.get('/', custumersController.index);

module.exports = route;