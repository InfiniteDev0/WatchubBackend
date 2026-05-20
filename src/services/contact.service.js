const supabase = require("../config/supabase");

async function createContactMessage({ full_name, email, subject, message, user_id }) {
  const { data, error } = await supabase
    .from("contact_messages")
    .insert({ full_name, email, subject, message, user_id: user_id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = { createContactMessage };
