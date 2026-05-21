const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const {
  getStats,
  listAllOrders,
  getAdminOrder,
  updateOrderStatus,
  listAllReviews,
  deleteAdminReview,
  listAllMessages,
  updateMessage,
  deleteMessage,
} = require("../controllers/admin.controller");

// All admin routes require authentication + admin role.
router.use(authenticate, requireAdmin);

router.get("/stats", getStats);

router.get("/orders", listAllOrders);
router.get("/orders/:id", getAdminOrder);
router.patch("/orders/:id/status", updateOrderStatus);

router.get("/reviews", listAllReviews);
router.delete("/reviews/:id", deleteAdminReview);

router.get("/messages", listAllMessages);
router.patch("/messages/:id", updateMessage);
router.delete("/messages/:id", deleteMessage);

module.exports = router;
