const supabase = require("../config/supabase");

const PRODUCT_FIELDS =
  "id, name, price, discount_price, images, movement_type, case_material, sku";

// GET /api/wishlist
async function getWishlist(req, res, next) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("wishlist_items")
      .select(`*, product:products(${PRODUCT_FIELDS})`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ items: data ?? [] });
  } catch (err) {
    next(err);
  }
}

// POST /api/wishlist
async function addToWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    // upsert: safe to call even if already wishlisted
    const { data, error } = await supabase
      .from("wishlist_items")
      .upsert({ user_id: userId, product_id }, { onConflict: "user_id,product_id" })
      .select(`*, product:products(${PRODUCT_FIELDS})`)
      .single();

    // PGRST116 = no row returned (duplicate ignored) — that's fine
    if (error && error.code !== "PGRST116") throw error;

    res.status(201).json(data ?? {});
  } catch (err) {
    next(err);
  }
}

// DELETE /api/wishlist/:productId
async function removeFromWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
