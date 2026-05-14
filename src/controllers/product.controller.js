const supabase = require("../config/supabase");

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/products — public
async function getAllProducts(req, res, next) {
  try {
    const {
      brand_id,
      status,
      is_featured,
      is_new_arrival,
      is_best_seller,
      search,
      limit = 50,
      offset,
      page = 1,
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const from =
      offset !== undefined ? Number(offset) : (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from("products")
      .select("*, brand:brands(id, name, logo_url)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (brand_id) query = query.eq("brand_id", brand_id);
    if (status) query = query.eq("status", status);
    if (is_featured === "true") query = query.eq("is_featured", true);
    if (is_new_arrival === "true") query = query.eq("is_new_arrival", true);
    if (is_best_seller === "true") query = query.eq("is_best_seller", true);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    res.json({
      products: data,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:id — public
async function getProduct(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, brand:brands(id, name, logo_url, banner_url)")
      .eq("id", req.params.id)
      .single();
    if (error || !data)
      return res.status(404).json({ error: "Product not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/products — admin only
async function createProduct(req, res, next) {
  try {
    const {
      name,
      sku,
      description,
      price,
      compare_at_price,
      brand_id,
      images,
      stock_quantity,
      status,
      is_featured,
      is_new_arrival,
      is_best_seller,
      is_active,
      movement_type,
      case_material,
      case_diameter_mm,
      case_thickness_mm,
      band_material,
      band_width_mm,
      dial_color,
      crystal_type,
      water_resistance_m,
      lug_width_mm,
      tags,
    } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ error: "Product name is required" });
    if (!price) return res.status(400).json({ error: "Price is required" });
    if (!brand_id) return res.status(400).json({ error: "Brand is required" });

    const slug = slugify(name);

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        slug,
        sku: sku || null,
        description: description || null,
        price: parseFloat(price),
        compare_at_price: compare_at_price
          ? parseFloat(compare_at_price)
          : null,
        brand_id,
        images: images || [],
        stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
        status: status || "DRAFT",
        is_featured: is_featured || false,
        is_new_arrival: is_new_arrival !== false,
        is_best_seller: is_best_seller || false,
        is_active: is_active !== false,
        movement_type: movement_type || null,
        case_material: case_material || null,
        case_diameter_mm: case_diameter_mm
          ? parseFloat(case_diameter_mm)
          : null,
        case_thickness_mm: case_thickness_mm
          ? parseFloat(case_thickness_mm)
          : null,
        band_material: band_material || null,
        band_width_mm: band_width_mm ? parseFloat(band_width_mm) : null,
        dial_color: dial_color || null,
        crystal_type: crystal_type || null,
        water_resistance_m: water_resistance_m
          ? parseInt(water_resistance_m)
          : null,
        lug_width_mm: lug_width_mm ? parseFloat(lug_width_mm) : null,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505")
        return res
          .status(409)
          .json({ error: "A product with this name or SKU already exists" });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

// PUT /api/products/:id — admin only
async function updateProduct(req, res, next) {
  try {
    const allowed = [
      "name",
      "sku",
      "description",
      "price",
      "compare_at_price",
      "brand_id",
      "images",
      "stock_quantity",
      "status",
      "is_featured",
      "is_new_arrival",
      "is_best_seller",
      "is_active",
      "movement_type",
      "case_material",
      "case_diameter_mm",
      "case_thickness_mm",
      "band_material",
      "band_width_mm",
      "dial_color",
      "crystal_type",
      "water_resistance_m",
      "lug_width_mm",
      "tags",
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.name) updates.slug = slugify(updates.name);

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error || !data)
      return res.status(404).json({ error: "Product not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/products/:id — admin only
async function deleteProduct(req, res, next) {
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
