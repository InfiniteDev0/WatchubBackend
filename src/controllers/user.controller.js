const userService = require("../services/user.service");

// GET /api/users  <- admin only
async function listUsers(req, res, next) {
  try {
    const data = await userService.getAllProfiles();
    res.json(data);
  } catch (err) { next(err); }
}

// GET /api/users/:id
async function getUser(req, res, next) {
  try {
    const data = await userService.getProfileById(req.params.id);
    if (!data) return res.status(404).json({ error: "User not found" });
    res.json(data);
  } catch (err) { next(err); }
}

// PATCH /api/users/:id
async function updateUser(req, res, next) {
  try {
    const data = await userService.updateProfile(req.params.id, req.body);
    res.json(data);
  } catch (err) { next(err); }
}

// PATCH /api/users/:id/role  <- admin only
async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!["admin", "customer"].includes(role))
      return res.status(400).json({ error: "role must be 'admin' or 'customer'" });
    const data = await userService.updateProfileRole(req.params.id, role);
    res.json(data);
  } catch (err) { next(err); }
}

// DELETE /api/users/:id  <- admin only
async function deleteUser(req, res, next) {
  try {
    await userService.deleteAuthUser(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) { next(err); }
}

// GET /api/users/:id/addresses
async function getAddresses(req, res, next) {
  try {
    const data = await userService.getAddressesByUser(req.params.id);
    res.json(data);
  } catch (err) { next(err); }
}

// POST /api/users/:id/addresses
async function addAddress(req, res, next) {
  try {
    const { full_name, street, city, postal_code, country } = req.body;
    if (!full_name || !street || !city || !postal_code || !country)
      return res.status(400).json({ error: "full_name, street, city, postal_code and country are required" });
    const data = await userService.createAddress(req.params.id, req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
}

// PATCH /api/users/:id/addresses/:aid
async function updateAddress(req, res, next) {
  try {
    const data = await userService.updateAddress(req.params.id, req.params.aid, req.body);
    res.json(data);
  } catch (err) { next(err); }
}

// DELETE /api/users/:id/addresses/:aid
async function deleteAddress(req, res, next) {
  try {
    await userService.deleteAddress(req.params.id, req.params.aid);
    res.json({ message: "Address deleted" });
  } catch (err) { next(err); }
}

module.exports = { listUsers, getUser, updateUser, updateUserRole, deleteUser, getAddresses, addAddress, updateAddress, deleteAddress };
