require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// ── Security & Logging ──────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));

// ── CORS ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Next.js admin
    ],
    credentials: true,
  }),
);

// ── Body Parsing ─────────────────────────────────────────────────
app.use(express.json());

// ── Health Check ─────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/brands", require("./routes/brand.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/wishlist", require("./routes/wishlist.routes"));
// /api/upload removed — files upload directly to Supabase Storage from browser

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`WatchHub backend running on http://localhost:${PORT}`);
});
