const supabase = require("../config/supabase");

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/brands — public
async function getAllBrands(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/brands/:id — public
async function getBrand(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data)
      return res.status(404).json({ error: "Brand not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/brands — admin only
async function createBrand(req, res, next) {
  try {
    const { name, description, logo_url, banner_url, is_active } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ error: "Brand name is required" });

    const slug = slugify(name);

    const { data, error } = await supabase
      .from("brands")
      .insert({
        name: name.trim(),
        slug,
        description: description || null,
        logo_url: logo_url || null,
        banner_url: banner_url || null,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505")
        return res
          .status(409)
          .json({ error: "A brand with this name already exists" });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

// PUT /api/brands/:id — admin only
async function updateBrand(req, res, next) {
  try {
    const { name, description, logo_url, banner_url, is_active } = req.body;
    const updates = {};
    if (name !== undefined) {
      updates.name = name.trim();
      updates.slug = slugify(name);
    }
    if (description !== undefined) updates.description = description;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (banner_url !== undefined) updates.banner_url = banner_url;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error || !data)
      return res.status(404).json({ error: "Brand not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/brands/:id — admin only
async function deleteBrand(req, res, next) {
  try {
    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Brand deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
