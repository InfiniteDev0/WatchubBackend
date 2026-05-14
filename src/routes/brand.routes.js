const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const {
  getAllBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require("../controllers/brand.controller");

// Public reads
router.get("/", getAllBrands);
router.get("/:id", getBrand);

// Admin writes
router.post("/", authenticate, requireAdmin, createBrand);
router.put("/:id", authenticate, requireAdmin, updateBrand);
router.delete("/:id", authenticate, requireAdmin, deleteBrand);

module.exports = router;
