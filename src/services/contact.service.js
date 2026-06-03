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

// Lists every message belonging to a given user, newest first. Includes the
// admin reply + read state so the customer's "Messages" screen can render it.
async function getUserMessages(userId) {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, subject, message, reply, replied_at, user_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Marks a single message (scoped to its owner) as read by the customer.
async function markUserMessageRead(userId, messageId) {
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ user_read: true })
    .eq("id", messageId)
    .eq("user_id", userId)
    .select("id, subject, message, reply, replied_at, user_read, created_at")
    .maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = {
  createContactMessage,
  getUserMessages,
  markUserMessageRead,
};
