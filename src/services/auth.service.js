const supabase = require("../config/supabase");

// ── Register ────────────────────────────────────────────────────
async function signUp(email, password, fullName) {
  // Uses admin API so service role key creates the user and triggers
  // the email-OTP confirmation regardless of anon/service key context.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: false, // Supabase will send a 6-digit OTP to the email
  });
  if (error) throw error;
  return data.user;
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

async function signOut(token) {
  if (token) await supabase.auth.admin.signOut(token);
}

async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

module.exports = { signUp, signIn, signOut, sendPasswordReset };
