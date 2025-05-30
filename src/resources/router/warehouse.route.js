const express = require('express');
const router = express.Router();

const WarehouseController = require('../app/controller/warehouse.controller');

router.get('/filter', WarehouseController.filterWarehouse);
router.delete('/:id', WarehouseController.delete);
router.get('/', WarehouseController.index);

module.exports = router;