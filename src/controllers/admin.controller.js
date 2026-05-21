const supabase = require("../config/supabase");

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
// Lists every order with the customer's name and email.
// Query params: status, page, limit
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
        "id, status, total, created_at, updated_at, shipping_address, profiles(id, full_name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    const orders = data.map((o) => ({
      ...o,
      customer_name: o.profiles?.full_name ?? "Unknown",
      customer_id: o.profiles?.id ?? null,
      profiles: undefined,
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
        "*, order_items(id, product_id, quantity, price_at_purchase, product_name, product_image), profiles(id, full_name)"
      )
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      return res.status(404).json({ error: "Order not found" });

    res.json({
      ...data,
      customer_name: data.profiles?.full_name ?? "Unknown",
      customer_id: data.profiles?.id ?? null,
      profiles: undefined,
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
    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });

    const { data, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error || !data)
      return res.status(404).json({ error: "Order not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reviews ────────────────────────────────────────
// Lists all reviews across all products with user + product info.
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
        "id, rating, title, body, created_at, user_id, product_id, profiles(full_name), products(name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const reviews = data.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
      user_id: r.user_id,
      product_id: r.product_id,
      user_name: r.profiles?.full_name ?? "Anonymous",
      product_name: r.products?.name ?? "Unknown Product",
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

module.exports = {
  getStats,
  listAllOrders,
  getAdminOrder,
  updateOrderStatus,
  listAllReviews,
  deleteAdminReview,
};
