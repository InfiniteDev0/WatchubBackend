const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const {
  listUsers,
  getUser,
  updateUser,
  updateUserRole,
  deleteUser,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/user.controller");

// Admin only: list all users
router.get("/", authenticate, requireAdmin, listUsers);

// Single user: any authenticated user can read their own; admin can read any
router.get("/:id", authenticate, getUser);
router.patch("/:id", authenticate, updateUser);
router.patch("/:id/role", authenticate, requireAdmin, updateUserRole);
router.delete("/:id", authenticate, requireAdmin, deleteUser);

// Addresses
router.get("/:id/addresses", authenticate, getAddresses);
router.post("/:id/addresses", authenticate, addAddress);
router.patch("/:id/addresses/:aid", authenticate, updateAddress);
router.delete("/:id/addresses/:aid", authenticate, deleteAddress);

module.exports = router;
