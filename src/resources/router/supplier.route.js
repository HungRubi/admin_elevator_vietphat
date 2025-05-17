const express = require('express');
const router = express.Router();
const SupplierController = require('../app/controller/supplier.controller');

router.post('/add', SupplierController.store);
router.put('/update/:id', SupplierController.update);
router.delete('/delete/:id', SupplierController.delete);
router.get('/product/:id', SupplierController.getProductBySupplier);
router.get('/edit/:id', SupplierController.edit);
router.get('/', SupplierController.index);

module.exports = router;