const express = require('express');
const router = express.Router();

const WarehouseController = require('../app/controller/warehouse.controller');

router.get('/', WarehouseController.index);

module.exports = router;