const express = require('express');
const route = express.Router();

const productsController = require('../app/controller/products.controller');

/** API */
route.get('/api/getallproducts', productsController.getAllProducts);

/** Route */
route.post('/store', productsController.store);
route.put('/:id', productsController.update);
route.delete('/:id', productsController.delete)
route.get('/add', productsController.add);
route.get('/:id/edit', productsController.edit);
route.get('/', productsController.index);

module.exports = route;