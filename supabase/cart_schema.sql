-- ================================================================
-- WatchHub — Cart Schema
-- Paste this entire script into the Supabase SQL Editor and run it.
-- ================================================================


-- ── 1. carts table ──────────────────────────────────────────────
-- One row per user. Created lazily the first time they add an item.

CREATE TABLE IF NOT EXISTS public.carts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── 2. cart_items table ─────────────────────────────────────────
-- One row per unique product inside a cart.
--
-- cart_id  → FK to carts.id  (required so getCart join works in Supabase)
-- user_id  → stored here too for fast ownership checks on update/delete
-- UNIQUE(cart_id, product_id) prevents duplicate rows for the same product

CREATE TABLE IF NOT EXISTS public.cart_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID        NOT NULL REFERENCES public.carts(id)    ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
  product_id UUID        NOT NULL REFERENCES public.products(id)  ON DELETE CASCADE,
  quantity   INTEGER     NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);


-- ── 3. Auto-update updated_at on every write ─────────────────────
-- Skip the CREATE FUNCTION block if set_updated_at() already exists
-- in your database from another table migration.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER carts_set_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER cart_items_set_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 4. Row Level Security ────────────────────────────────────────
-- The Express backend uses the service-role key so it bypasses RLS.
-- These policies protect any direct client / anon requests.

ALTER TABLE public.carts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carts: own rows only"
  ON public.carts
  USING (auth.uid() = user_id);

CREATE POLICY "cart_items: own rows only"
  ON public.cart_items
  USING (auth.uid() = user_id);
