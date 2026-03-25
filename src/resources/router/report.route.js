const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();

const reportController = require('../app/controller/report.controller');
const middleware = require('../app/controller/middleware.controller');

const reportStaffLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_REPORT_STAFF_PER_MINUTE || 90)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

route.get('/week', reportStaffLimiter, middleware.verifyTokenStaff, reportController.getRevenueByDate);
route.get('/', reportStaffLimiter, middleware.verifyTokenStaff, reportController.index);

module.exports = route;