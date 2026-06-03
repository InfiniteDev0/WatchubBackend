const express = require("express");
const router = express.Router();
const {
  submitContact,
  getMyMessages,
  markMyMessageRead,
} = require("../controllers/contact.controller");
const {
  authenticate,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");

// Optional auth — attach user_id if logged in, allow anonymous submissions too.
router.post("/", optionalAuthenticate, submitContact);

// Customer-facing message history + read tracking (requires login).
router.get("/mine", authenticate, getMyMessages);
router.patch("/:id/read", authenticate, markMyMessageRead);

module.exports = router;
