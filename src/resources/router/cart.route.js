const express = require('express');
const router = express.Router();

const CartController = require('../app/controller/cart.controller');

router.put('/update/:id', CartController.updateCart);

module.exports = router