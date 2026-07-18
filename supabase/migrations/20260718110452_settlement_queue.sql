-- Monday settlement FIFO queue fields for withdrawals.
-- NOTE: enum ADD VALUE must be committed before use in indexes/constraints.
-- Index covering 'processing' is added in the follow-up migration.

ALTER TYPE public.withdrawal_status ADD VALUE IF NOT EXISTS 'processing';

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS queue_number INTEGER,
  ADD COLUMN IF NOT EXISTS batch_number INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_processing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_withdrawals_settlement_queue
  ON public.withdrawals (status, created_at ASC)
  WHERE status IN ('scheduled', 'pending', 'approved');

COMMENT ON COLUMN public.withdrawals.queue_number IS
  'FIFO settlement queue number assigned when the request enters the Monday settlement queue.';
COMMENT ON COLUMN public.withdrawals.estimated_processing_at IS
  'Estimated payout time based on queue position and configurable batch throughput.';

INSERT INTO public.settings (key, value)
VALUES (
  'settlement_queue',
  '{
    "batch_size": 10,
    "batch_interval_minutes": 10,
    "paused": false
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
