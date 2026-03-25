const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const WarehouseController = require('../app/controller/warehouse.controller');
const middleware = require('../app/controller/middleware.controller');

const warehouseStaffLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_WAREHOUSE_STAFF_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

router.get('/filter', warehouseStaffLimiter, middleware.verifyTokenStaff, WarehouseController.filterWarehouse);
router.delete('/:id', warehouseStaffLimiter, middleware.verifyTokenStaff, WarehouseController.delete);
router.get('/', warehouseStaffLimiter, middleware.verifyTokenStaff, WarehouseController.index);

module.exports = router;
