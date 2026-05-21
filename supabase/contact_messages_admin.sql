-- ================================================================
-- WatchHub — Contact messages admin support
-- Ensures the contact_messages table has an `is_read` column so admin
-- can track which feedback entries have been reviewed.
-- Idempotent: safe to re-run.
-- ================================================================

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS contact_messages_is_read_idx
  ON public.contact_messages (is_read)
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON public.contact_messages (created_at DESC);
