const orderService = require("../services/order.service");

// GET /api/orders
async function listOrders(req, res, next) {
  try {
    const data = await orderService.getOrdersByUser(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
}

// GET /api/orders/:id
async function getOrder(req, res, next) {
  try {
    const data = await orderService.getOrderById(req.params.id, req.user.id);
    if (!data) return res.status(404).json({ error: "Order not found" });
    res.json(data);
  } catch (err) { next(err); }
}

// POST /api/orders
async function createOrder(req, res, next) {
  try {
    const { shipping_address } = req.body;
    if (!shipping_address)
      return res.status(400).json({ error: "shipping_address is required" });

    const { full_name, street, city, postal_code, country } = shipping_address;
    if (!full_name || !street || !city || !postal_code || !country)
      return res.status(400).json({
        error: "shipping_address must include full_name, street, city, postal_code, country",
      });

    const data = await orderService.createOrder(req.user.id, { shipping_address });
    res.status(201).json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

// PATCH /api/orders/:id/cancel
async function cancelOrder(req, res, next) {
  try {
    const data = await orderService.cancelOrder(req.params.id, req.user.id);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

module.exports = { listOrders, getOrder, createOrder, cancelOrder };
