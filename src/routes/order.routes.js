const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { listOrders, getOrder, createOrder, cancelOrder } = require("../controllers/order.controller");

router.get("/", authenticate, listOrders);
router.get("/:id", authenticate, getOrder);
router.post("/", authenticate, createOrder);
router.patch("/:id/cancel", authenticate, cancelOrder);

module.exports = router;
