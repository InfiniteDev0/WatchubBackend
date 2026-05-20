const supabase = require("../config/supabase");

// ── Reviews ────────────────────────────────────────────────────────

async function getReviewsByProduct(productId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, title, body, created_at, user_id, profiles(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    created_at: r.created_at,
    user_id: r.user_id,
    user_name: r.profiles?.full_name ?? "Anonymous",
  }));
}

async function getReviewSummary(productId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);
  if (error) throw error;

  if (!data.length) {
    return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of data) {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    sum += r.rating;
  }

  return {
    average: Math.round((sum / data.length) * 10) / 10,
    total: data.length,
    distribution,
  };
}

async function upsertReview(userId, productId, { rating, title, body }) {
  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        user_id: userId,
        product_id: productId,
        rating,
        title: title || null,
        body: body || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,product_id" }
    )
    .select("id, rating, title, body, created_at, user_id")
    .single();
  if (error) throw error;
  return data;
}

async function deleteReview(reviewId, userId) {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);
  if (error) throw error;
}

async function getUserReviewForProduct(userId, productId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, title, body, created_at")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

module.exports = {
  getReviewsByProduct,
  getReviewSummary,
  upsertReview,
  deleteReview,
  getUserReviewForProduct,
};
