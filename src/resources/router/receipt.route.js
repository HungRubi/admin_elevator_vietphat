const express = require('express');
const router = express.Router();
const ReceiptController = require('../app/controller/receipt.controller');

router.post('/add', ReceiptController.add);
router.delete('/:id', ReceiptController.deleteReceipt);
router.put('/:id', ReceiptController.updateReceipt);
router.get('/:id', ReceiptController.getReceipt);
router.get('/', ReceiptController.index);

module.exports = router;