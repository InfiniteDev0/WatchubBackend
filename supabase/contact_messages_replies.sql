-- ================================================================
-- WatchHub — Contact messages admin replies + user read tracking
-- Adds admin reply support so admins can respond to feedback, and a
-- separate `user_read` flag so the customer can mark the reply as read
-- (distinct from the admin-side `is_read` which tracks admin review).
-- Idempotent: safe to re-run.
-- ================================================================

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS reply TEXT,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
  -- Whether the customer has read the admin's reply. New replies arrive
  -- as user_read = FALSE so the app can surface an unread indicator.
  ADD COLUMN IF NOT EXISTS user_read BOOLEAN NOT NULL DEFAULT FALSE;

-- Fast lookup of a customer's own messages, newest first.
CREATE INDEX IF NOT EXISTS contact_messages_user_id_idx
  ON public.contact_messages (user_id, created_at DESC);

-- Partial index for the customer's unread-reply badge count.
CREATE INDEX IF NOT EXISTS contact_messages_user_unread_idx
  ON public.contact_messages (user_id)
  WHERE reply IS NOT NULL AND user_read = FALSE;
