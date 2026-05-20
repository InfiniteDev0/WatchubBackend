const supabase = require("../config/supabase");

// GET /api/cart
async function getCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from("carts")
      .select("*, items:cart_items(*, product:products(*))")
      .eq("user_id", userId)
      .single();

    // PGRST116 = no rows found; user has no cart yet — return empty
    if (error && error.code !== "PGRST116") throw error;
    res.json(data || { items: [] });
  } catch (err) {
    next(err);
  }
}

// POST /api/cart/add
async function addToCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: "quantity must be a positive integer" });
    }

    // ── Step 1: get or create this user's cart ──────────────────────────────
    let { data: cart, error: cartFindErr } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (cartFindErr && cartFindErr.code !== "PGRST116") throw cartFindErr;

    if (!cart) {
      const { data: newCart, error: cartInsertErr } = await supabase
        .from("carts")
        .insert({ user_id: userId })
        .select("id")
        .single();
      if (cartInsertErr) throw cartInsertErr;
      cart = newCart;
    }

    // ── Step 2: increment if product already in cart, else insert ───────────
    const { data: existing, error: findErr } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cart.id)
      .eq("product_id", product_id)
      .single();

    if (findErr && findErr.code !== "PGRST116") throw findErr;

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("cart_items")
        .insert({ cart_id: cart.id, user_id: userId, product_id, quantity })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// PUT /api/cart/item/:itemId
async function updateCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "quantity must be >= 1" });
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", itemId)
      .eq("user_id", userId) // scope to owner for security
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Cart item not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cart/item/:itemId
async function removeFromCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ message: "Item removed" });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cart/clear
async function clearCart(req, res, next) {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
