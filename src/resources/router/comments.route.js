const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();
const commentController = require('../app/controller/comments.controller');
const middleware = require('../app/controller/middleware.controller');

const commentAddLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_COMMENT_ADD_PER_MINUTE || 45)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều đánh giá trong thời gian ngắn, vui lòng thử lại sau.' },
});

const commentStaffReadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_COMMENT_STAFF_PER_MINUTE || 120)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

route.post(
    '/add',
    commentAddLimiter,
    middleware.verifyToken,
    commentController.addComment
);
route.get(
    '/filter',
    commentStaffReadLimiter,
    middleware.verifyTokenStaff,
    commentController.filterComment
);
route.get(
    '/all',
    commentStaffReadLimiter,
    middleware.verifyTokenStaff,
    commentController.getComment
);

module.exports = route;
