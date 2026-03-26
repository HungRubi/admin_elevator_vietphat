const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const CartController = require('../app/controller/cart.controller');
const middleware = require('../app/controller/middleware.controller');

const cartMutationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_CART_PER_MINUTE || 90)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều thao tác giỏ hàng, vui lòng thử lại sau.' },
});

const cartGetLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Math.max(1, Number(process.env.RATE_LIMIT_CART_GET_PER_MINUTE || 180)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

router.get('/:id', cartGetLimiter, middleware.verifyToken, CartController.getCart);

router.put(
    '/update/:id',
    cartMutationLimiter,
    middleware.verifyToken,
    CartController.updateCart
);
router.put(
    '/delete/:id',
    cartMutationLimiter,
    middleware.verifyToken,
    CartController.deleteCartItem
);

module.exports = router;