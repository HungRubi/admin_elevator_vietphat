const express = require("express");
const route = express.Router();

const warrantyController = require('../app/controller/warranty.controller');

route.get("/add", warrantyController.add);

module.exports = route;