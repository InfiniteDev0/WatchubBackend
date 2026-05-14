const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

// Public reads
router.get("/", getAllProducts);
router.get("/:id", getProduct);

// Admin writes
router.post("/", authenticate, requireAdmin, createProduct);
router.put("/:id", authenticate, requireAdmin, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);

module.exports = router;
