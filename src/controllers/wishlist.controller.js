const supabase = require("../config/supabase");

// GET /api/wishlist
async function getWishlist(req, res, next) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("*, product:products(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[wishlist] getWishlist error:", error);
      throw error;
    }

    res.json({ items: data ?? [] });
  } catch (err) {
    next(err);
  }
}

// POST /api/wishlist   body: { product_id }
async function addToWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    // Upsert — safe to call even when already wishlisted
    const { error: upsertError } = await supabase
      .from("wishlist_items")
      .upsert(
        { user_id: userId, product_id },
        { onConflict: "user_id,product_id", ignoreDuplicates: true },
      );

    if (upsertError) {
      console.error("[wishlist] upsert error:", upsertError);
      throw upsertError;
    }

    // Fetch the full row with product details
    const { data, error: selectError } = await supabase
      .from("wishlist_items")
      .select("*, product:products(*)")
      .eq("user_id", userId)
      .eq("product_id", product_id)
      .single();

    if (selectError) {
      console.error("[wishlist] select error:", selectError);
      throw selectError;
    }

    res.status(201).json(data);
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

    if (error) {
      console.error("[wishlist] delete error:", error);
      throw error;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
