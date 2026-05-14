const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  resetPassword,
} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/reset-password", resetPassword);

module.exports = router;
