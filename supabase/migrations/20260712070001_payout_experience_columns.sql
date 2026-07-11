-- Payout experience (part 2): columns, profile flag, and partial index.

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (request_type IN ('manual', 'automatic')),
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auto_weekly_payout BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_withdrawals_scheduled_at ON public.withdrawals(scheduled_at)
  WHERE status = 'scheduled';
