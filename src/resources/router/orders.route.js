const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();

const ordersController = require('../app/controller/orders.controller');
const middleware = require('../app/controller/middleware.controller');

const orderStoreLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_ORDER_STORE_PER_MINUTE || 30)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu đặt hàng, vui lòng thử lại sau.' },
});

const orderStaffLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_ORDER_STAFF_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

route.get(
    '/api/count',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.getOrderLast7Days
);
route.get(
    '/details/:id',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.details
);
route.get(
    '/discount-chart',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.getOrderDiscount
);
route.get(
    '/monthly-chart',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.getMonthlyRevenue
);
route.get(
    '/payment-chart',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.getOrderDiscountSummary
);
route.put(
    '/admin/:id',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.updateOrderAdmin
);
route.post(
    '/store',
    orderStoreLimiter,
    middleware.verifyToken,
    ordersController.store
);
route.get(
    '/filter',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.filterOrders
);
route.get(
    '/add',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.add
);
route.get(
    '/',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.index
);

route.put(
    '/:id',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.update
);
route.delete(
    '/:id',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.deleteDetails
);
route.get(
    '/:id',
    orderStaffLimiter,
    middleware.verifyTokenStaff,
    ordersController.edit
);

module.exports = route;
