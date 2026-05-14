const {
  signUp,
  signIn,
  signOut,
  sendPasswordReset,
} = require("../services/auth.service");

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const user = await signUp(email, password, full_name ?? "");
    res.status(201).json({
      message: "Account created. Check your email for the verification OTP.",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    // Duplicate email returns a 422 from Supabase
    if (err.status === 422 || err.message?.includes("already registered")) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const data = await signIn(email, password);
    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    await signOut(token);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    await sendPasswordReset(email);
    res.json({ message: "Password reset email sent" });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, resetPassword };
