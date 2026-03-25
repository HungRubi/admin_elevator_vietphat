const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const SupplierController = require('../app/controller/supplier.controller');
const middleware = require('../app/controller/middleware.controller');

const supplierStaffLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_SUPPLIER_STAFF_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

router.post('/add', supplierStaffLimiter, middleware.verifyTokenStaff, SupplierController.store);
router.put('/update/:id', supplierStaffLimiter, middleware.verifyTokenStaff, SupplierController.update);
router.delete('/delete/:id', supplierStaffLimiter, middleware.verifyTokenStaff, SupplierController.delete);
router.get('/product/:id', supplierStaffLimiter, middleware.verifyTokenStaff, SupplierController.getProductBySupplier);
router.get('/edit/:id', supplierStaffLimiter, middleware.verifyTokenStaff, SupplierController.edit);
router.get('/', supplierStaffLimiter, middleware.verifyTokenStaff, SupplierController.index);

module.exports = router;
