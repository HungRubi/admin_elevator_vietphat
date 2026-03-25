const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();

const warrantyController = require('../app/controller/warranty.controller');
const middleware = require('../app/controller/middleware.controller');

const warrantyStaffLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_WARRANTY_STAFF_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

route.get('/filter', warrantyStaffLimiter, middleware.verifyTokenStaff, warrantyController.filterWarranty);
route.get('/add', warrantyStaffLimiter, middleware.verifyTokenStaff, warrantyController.add);
route.post('/store', warrantyStaffLimiter, middleware.verifyTokenStaff, warrantyController.store);

route.get('/:id', warrantyStaffLimiter, middleware.verifyTokenStaff, warrantyController.detail);
route.put('/:id', warrantyStaffLimiter, middleware.verifyTokenStaff, warrantyController.update);
route.delete('/:id', warrantyStaffLimiter, middleware.verifyTokenStaff, warrantyController.delete);

route.get('/', warrantyStaffLimiter, middleware.verifyTokenStaff, warrantyController.index);

module.exports = route;
