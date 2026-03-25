const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();

const notificationController = require('../app/controller/notification.controller');
const middleware = require('../app/controller/middleware.controller');

const notificationCustomerLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_NOTIFICATION_CUSTOMER_PER_MINUTE || 90)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

const notificationStaffLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_NOTIFICATION_STAFF_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

route.put(
    '/read/:id',
    notificationCustomerLimiter,
    middleware.verifyToken,
    notificationController.isReadNotification
);
route.get(
    '/all/:id',
    notificationCustomerLimiter,
    middleware.verifyToken,
    notificationController.getAllNotifiByUser
);
route.post(
    '/add',
    notificationStaffLimiter,
    middleware.verifyTokenStaff,
    notificationController.addNotification
);
route.get(
    '/filter',
    notificationStaffLimiter,
    middleware.verifyTokenStaff,
    notificationController.filterNotification
);
route.get(
    '/',
    notificationStaffLimiter,
    middleware.verifyTokenStaff,
    notificationController.getNotification
);
route.get(
    '/:id',
    notificationStaffLimiter,
    middleware.verifyTokenStaff,
    notificationController.editNotification
);
route.put(
    '/:id',
    notificationStaffLimiter,
    middleware.verifyTokenStaff,
    notificationController.updateNotification
);
route.delete(
    '/:id',
    notificationStaffLimiter,
    middleware.verifyTokenStaff,
    notificationController.deleteNotification
);

module.exports = route;
