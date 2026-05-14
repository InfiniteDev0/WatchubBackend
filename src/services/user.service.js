const supabase = require("../config/supabase");

// ── Profiles ──────────────────────────────────────────────────────

async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url, role, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function getProfileById(id) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url, role, created_at, updated_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function updateProfile(id, updates) {
  const allowed = ["full_name", "phone", "avatar_url"];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(
      ([k, v]) => allowed.includes(k) && v !== undefined,
    ),
  );
  filtered.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(filtered)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateProfileRole(id, role) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteAuthUser(id) {
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw error;
}

// ── Addresses ─────────────────────────────────────────────────────

async function getAddressesByUser(userId) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  if (error) throw error;
  return data;
}

async function createAddress(userId, fields) {
  if (fields.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId);
  }
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...fields, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateAddress(userId, addressId, fields) {
  if (fields.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId);
  }
  const { data, error } = await supabase
    .from("addresses")
    .update(fields)
    .eq("id", addressId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteAddress(userId, addressId) {
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);
  if (error) throw error;
}

module.exports = {
  getAllProfiles,
  getProfileById,
  updateProfile,
  updateProfileRole,
  deleteAuthUser,
  getAddressesByUser,
  createAddress,
  updateAddress,
  deleteAddress,
};
