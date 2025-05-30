const express = require("express");
const route = express.Router();

const warrantyController = require('../app/controller/warranty.controller');

route.get("/filter", warrantyController.filterWarranty);
route.get("/add", warrantyController.add);
route.post("/store", warrantyController.store);

// Các route có tham số /:id để SAU CÙNG
route.get("/:id", warrantyController.detail);
route.put("/:id", warrantyController.update);
route.delete("/:id", warrantyController.delete);

// Route mặc định cũng nên đặt sau cùng
route.get("/", warrantyController.index);


module.exports = route;