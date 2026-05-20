const supabase = require("../config/supabase");

// ── Orders ────────────────────────────────────────────────────────

async function getOrdersByUser(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Attach item_count as a computed field
  return data.map((o) => ({
    ...o,
    item_count: o.order_items?.length ?? 0,
    order_items: undefined,
  }));
}

async function getOrderById(orderId, userId) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, order_items(id, product_id, quantity, price_at_purchase, product_name, product_image)"
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

async function createOrder(userId, { shipping_address }) {
  // ── 1. Fetch the user's cart with product data ───────────────────
  const { data: cart, error: cartErr } = await supabase
    .from("carts")
    .select("id, cart_items(id, product_id, quantity, product:products(id, name, price, images))")
    .eq("user_id", userId)
    .single();

  if (cartErr && cartErr.code !== "PGRST116") throw cartErr;
  if (!cart || !cart.cart_items?.length)
    throw Object.assign(new Error("Cart is empty"), { status: 400 });

  // ── 2. Calculate total ───────────────────────────────────────────
  const total = cart.cart_items.reduce((sum, item) => {
    const price = Number(item.product?.price ?? 0);
    return sum + price * item.quantity;
  }, 0);

  // ── 3. Create the order row ──────────────────────────────────────
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({ user_id: userId, status: "pending", total, shipping_address })
    .select()
    .single();
  if (orderErr) throw orderErr;

  // ── 4. Insert order_items (snapshot price + name at purchase time) ─
  const itemsToInsert = cart.cart_items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_at_purchase: Number(item.product?.price ?? 0),
    product_name: item.product?.name ?? "",
    product_image: item.product?.images?.[0] ?? null,
  }));

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(itemsToInsert);
  if (itemsErr) throw itemsErr;

  // ── 5. Clear the cart ────────────────────────────────────────────
  await supabase.from("cart_items").delete().eq("user_id", userId);

  return { ...order, item_count: itemsToInsert.length };
}

async function cancelOrder(orderId, userId) {
  // Only pending orders can be cancelled by the customer
  const { data: existing, error: fetchErr } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !existing)
    throw Object.assign(new Error("Order not found"), { status: 404 });
  if (existing.status !== "pending")
    throw Object.assign(
      new Error("Only pending orders can be cancelled"),
      { status: 400 }
    );

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = { getOrdersByUser, getOrderById, createOrder, cancelOrder };
