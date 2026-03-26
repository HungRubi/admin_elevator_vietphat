const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();

const userController = require('../app/controller/user.controller');
const middleware = require('../app/controller/middleware.controller');

const userStaffLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_USER_STAFF_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

route.put(
    '/profile/update/:id',
    userStaffLimiter,
    middleware.verifyToken,
    userController.updateProfileUser
);
route.put(
    '/update/address/:id',
    userStaffLimiter,
    middleware.verifyToken,
    userController.updateAddress
);
route.get('/order/:id', userStaffLimiter, middleware.verifyTokenStaff, userController.getOrder);
route.get('/new', userStaffLimiter, middleware.verifyTokenStaff, userController.getNewUser);
route.get('/filter', userStaffLimiter, middleware.verifyTokenStaff, userController.filterUser);
route.post('/store', userStaffLimiter, middleware.verifyTokenStaff, userController.store);
route.delete('/:id', userStaffLimiter, middleware.verifyTokenStaff, userController.destroy);
route.get('/:id', userStaffLimiter, middleware.verifyTokenStaff, userController.getUserDetail);
route.get('/', userStaffLimiter, middleware.verifyTokenStaff, userController.getUser);

module.exports = route;
