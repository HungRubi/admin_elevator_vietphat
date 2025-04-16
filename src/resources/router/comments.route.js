const express = require('express');
const route = express.Router();
const commentController = require('../app/controller/comments.controller');

route.post('/add', commentController.addComment);

module.exports = route;