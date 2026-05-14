const supabase = require("../config/supabase");

// Verifies the Bearer token from the request header
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = user;
  next();
}

// Must be used AFTER authenticate
async function requireAdmin(req, res, next) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", req.user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

module.exports = { authenticate, requireAdmin };
