const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { listReviews, getMyReview, submitReview, deleteReview } = require("../controllers/review.controller");

// Public: get reviews + summary for a product
router.get("/product/:productId", listReviews);

// Authenticated: get/submit/delete own review
router.get("/product/:productId/mine", authenticate, getMyReview);
router.post("/product/:productId", authenticate, submitReview);
router.delete("/:reviewId", authenticate, deleteReview);

module.exports = router;
