const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const { signUpload } = require("../controllers/upload.controller");

// Admin only — returns a signed Cloudinary upload token
router.get("/sign", authenticate, requireAdmin, signUpload);

module.exports = router;
