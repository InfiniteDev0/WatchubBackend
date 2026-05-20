const reviewService = require("../services/review.service");

// GET /api/reviews/product/:productId
async function listReviews(req, res, next) {
  try {
    const [reviews, summary] = await Promise.all([
      reviewService.getReviewsByProduct(req.params.productId),
      reviewService.getReviewSummary(req.params.productId),
    ]);
    res.json({ reviews, summary });
  } catch (err) { next(err); }
}

// GET /api/reviews/product/:productId/mine  (authenticated)
async function getMyReview(req, res, next) {
  try {
    const review = await reviewService.getUserReviewForProduct(
      req.user.id,
      req.params.productId
    );
    res.json(review);
  } catch (err) { next(err); }
}

// POST /api/reviews/product/:productId  (authenticated — upsert)
async function submitReview(req, res, next) {
  try {
    const { rating, title, body } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: "rating must be 1–5" });

    const data = await reviewService.upsertReview(
      req.user.id,
      req.params.productId,
      { rating, title, body }
    );
    res.status(201).json(data);
  } catch (err) { next(err); }
}

// DELETE /api/reviews/:reviewId  (authenticated — own review only)
async function deleteReview(req, res, next) {
  try {
    await reviewService.deleteReview(req.params.reviewId, req.user.id);
    res.json({ message: "Review deleted" });
  } catch (err) { next(err); }
}

module.exports = { listReviews, getMyReview, submitReview, deleteReview };
