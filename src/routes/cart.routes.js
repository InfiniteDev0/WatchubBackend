const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cart.controller");

router.get("/", authenticate, getCart);
router.post("/add", authenticate, addToCart);
router.put("/item/:itemId", authenticate, updateCartItem);
router.delete("/item/:itemId", authenticate, removeFromCart);
router.delete("/clear", authenticate, clearCart);

module.exports = router;
