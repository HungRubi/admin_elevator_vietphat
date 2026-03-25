const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const ReceiptController = require('../app/controller/receipt.controller');
const middleware = require('../app/controller/middleware.controller');

const receiptStaffLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_RECEIPT_STAFF_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

router.post(
    '/add',
    receiptStaffLimiter,
    middleware.verifyTokenStaff,
    ReceiptController.add
);
router.get(
    '/filter',
    receiptStaffLimiter,
    middleware.verifyTokenStaff,
    ReceiptController.filterReceipt
);
router.get(
    '/',
    receiptStaffLimiter,
    middleware.verifyTokenStaff,
    ReceiptController.index
);
router.delete(
    '/:id',
    receiptStaffLimiter,
    middleware.verifyTokenStaff,
    ReceiptController.deleteReceipt
);
router.put(
    '/:id',
    receiptStaffLimiter,
    middleware.verifyTokenStaff,
    ReceiptController.updateReceipt
);
router.get(
    '/:id',
    receiptStaffLimiter,
    middleware.verifyTokenStaff,
    ReceiptController.getReceipt
);

module.exports = router;
