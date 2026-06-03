const supabase = require("../config/supabase");

// ── helpers ──────────────────────────────────────────────────────
// Resolve a set of user_ids → { id: full_name } map using the profiles table.
async function fetchProfileMap(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);
  if (error) throw error;
  const map = {};
  for (const p of data ?? []) map[p.id] = p.full_name;
  return map;
}

// ── GET /api/admin/stats ──────────────────────────────────────────
async function getStats(req, res, next) {
  try {
    const [usersRes, productsRes, ordersRes, revenueRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total").not("status", "eq", "cancelled"),
    ]);

    const totalRevenue = (revenueRes.data ?? []).reduce(
      (sum, o) => sum + Number(o.total ?? 0),
      0
    );

    res.json({
      total_users: usersRes.count ?? 0,
      total_products: productsRes.count ?? 0,
      total_orders: ordersRes.count ?? 0,
      total_revenue: Math.round(totalRevenue * 100) / 100,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/orders ─────────────────────────────────────────
async function listAllOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from("orders")
      .select(
        "id, user_id, status, total, created_at, updated_at, shipping_address",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    const profileMap = await fetchProfileMap((data ?? []).map((o) => o.user_id));

    const orders = (data ?? []).map((o) => ({
      ...o,
      customer_name: profileMap[o.user_id] ?? "Unknown",
      customer_id: o.user_id,
    }));

    res.json({
      orders,
      pagination: {
        total: count ?? 0,
        page: pageNum,
        pages: Math.ceil((count ?? 0) / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/orders/:id ─────────────────────────────────────
async function getAdminOrder(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, order_items(id, product_id, quantity, price_at_purchase, product_name, product_image)"
      )
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      return res.status(404).json({ error: "Order not found" });

    const profileMap = await fetchProfileMap([data.user_id]);

    res.json({
      ...data,
      customer_name: profileMap[data.user_id] ?? "Unknown",
      customer_id: data.user_id,
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/orders/:id/status ───────────────────────────
const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const id = req.params.id;

    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });

    // 1. Confirm the order exists. A missing row produces a clear 404 here
    //    rather than being masked by a generic "no rows affected" error
    //    when the update is chained with `.single()`.
    const { data: existing, error: fetchErr } = await supabase
      .from("orders")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[admin.updateOrderStatus] lookup failed:", fetchErr);
      return res.status(500).json({ error: fetchErr.message });
    }
    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 2. Apply the update and return the full row + items so the client
    //    can replace its cached entry without losing the items list.
    const { data, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(
        "*, order_items(id, product_id, quantity, price_at_purchase, product_name, product_image)"
      )
      .single();

    if (error || !data) {
      console.error("[admin.updateOrderStatus] update failed:", error);
      return res
        .status(500)
        .json({ error: error?.message ?? "Failed to update order" });
    }

    // 3. Decorate with customer name.
    const profileMap = await fetchProfileMap([data.user_id]);
    res.json({
      ...data,
      customer_name: profileMap[data.user_id] ?? "Unknown",
      customer_id: data.user_id,
    });
  } catch (err) {
    console.error("[admin.updateOrderStatus] unexpected:", err);
    next(err);
  }
}

// ── GET /api/admin/reviews ────────────────────────────────────────
async function listAllReviews(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data, error, count } = await supabase
      .from("reviews")
      .select(
        "id, rating, title, body, created_at, user_id, product_id",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = data ?? [];
    const userIds = rows.map((r) => r.user_id);
    const productIds = [...new Set(rows.map((r) => r.product_id).filter(Boolean))];

    const [profileMap, productsRes] = await Promise.all([
      fetchProfileMap(userIds),
      productIds.length
        ? supabase.from("products").select("id, name").in("id", productIds)
        : Promise.resolve({ data: [] }),
    ]);

    const productMap = {};
    for (const p of productsRes.data ?? []) productMap[p.id] = p.name;

    const reviews = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
      user_id: r.user_id,
      product_id: r.product_id,
      user_name: profileMap[r.user_id] ?? "Anonymous",
      product_name: productMap[r.product_id] ?? "Unknown Product",
    }));

    res.json({
      reviews,
      pagination: {
        total: count ?? 0,
        page: pageNum,
        pages: Math.ceil((count ?? 0) / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/admin/reviews/:id ────────────────────────────────
async function deleteAdminReview(req, res, next) {
  try {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/messages ──────────────────────────────────────
// Lists every contact_messages row (user-submitted feedback / issue reports).
async function listAllMessages(req, res, next) {
  try {
    const { page = 1, limit = 50, is_read } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (is_read === "true") query = query.eq("is_read", true);
    if (is_read === "false") query = query.eq("is_read", false);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      messages: data ?? [],
      pagination: {
        total: count ?? 0,
        page: pageNum,
        pages: Math.ceil((count ?? 0) / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/messages/:id ────────────────────────────────
// Accepts `is_read` (admin review flag) and/or `reply` (admin response).
// Sending a non-empty `reply` stamps `replied_at` and resets `user_read`
// to FALSE so the customer sees the reply as unread.
async function updateMessage(req, res, next) {
  try {
    const { is_read, reply } = req.body;

    const patch = {};
    if (is_read !== undefined) patch.is_read = !!is_read;
    if (reply !== undefined) {
      const trimmed = typeof reply === "string" ? reply.trim() : "";
      if (trimmed) {
        patch.reply = trimmed;
        patch.replied_at = new Date().toISOString();
        patch.user_read = false;
      } else {
        // Empty reply clears any existing response.
        patch.reply = null;
        patch.replied_at = null;
      }
    }

    if (Object.keys(patch).length === 0)
      return res.status(400).json({ error: "Nothing to update" });

    const { data, error } = await supabase
      .from("contact_messages")
      .update(patch)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error || !data)
      return res.status(404).json({ error: "Message not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/admin/messages/:id ───────────────────────────────
async function deleteMessage(req, res, next) {
  try {
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Message deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  listAllOrders,
  getAdminOrder,
  updateOrderStatus,
  listAllReviews,
  deleteAdminReview,
  listAllMessages,
  updateMessage,
  deleteMessage,
};
