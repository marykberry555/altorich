-- Extend settlement queue index now that 'processing' enum value is committed.

DROP INDEX IF EXISTS public.idx_withdrawals_settlement_queue;

CREATE INDEX idx_withdrawals_settlement_queue
  ON public.withdrawals (status, queue_number ASC NULLS LAST, created_at ASC)
  WHERE status IN ('scheduled', 'pending', 'approved', 'processing');
