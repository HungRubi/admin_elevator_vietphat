const express = require('express');
const route = express.Router();
const commentController = require('../app/controller/comments.controller');

route.post('/add', commentController.addComment);
route.get('/filter', commentController.filterComment);
route.get('/all', commentController.getComment);

module.exports = route;