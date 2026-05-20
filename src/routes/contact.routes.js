const express = require("express");
const router = express.Router();
const { submitContact } = require("../controllers/contact.controller");

// Optional auth — attach user_id if logged in, allow anonymous too
router.post("/", submitContact);

module.exports = router;
