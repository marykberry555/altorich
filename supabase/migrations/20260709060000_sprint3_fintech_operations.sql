-- Sprint 3: Payments, webhooks, KYC workflow, audit immutability, analytics indexes

-- Payment provider enum
DO $$ BEGIN
  CREATE TYPE public.payment_provider AS ENUM ('bank_transfer', 'paystack', 'flutterwave', 'monnify');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('initialized', 'pending', 'success', 'failed', 'cancelled', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend KYC status
ALTER TYPE public.kyc_status ADD VALUE IF NOT EXISTS 'requires_update';

-- Profile KYC summary (documents remain in kyc_documents)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status public.kyc_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS bvn_reference TEXT,
  ADD COLUMN IF NOT EXISTS nin_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);

-- Payment transactions (gateway lifecycle)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  deposit_id UUID REFERENCES public.deposits(id) ON DELETE SET NULL,
  provider public.payment_provider NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  provider_reference TEXT,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  status public.payment_status NOT NULL DEFAULT 'initialized',
  checkout_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_provider_ref ON public.payment_transactions(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payment_tx_created ON public.payment_transactions(created_at DESC);

-- Webhook idempotency / audit
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.payment_provider NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  reference TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_reference ON public.webhook_events(reference);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed) WHERE processed = false;

-- Extend deposits for gateway payments
ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS payment_provider public.payment_provider DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_deposits_provider ON public.deposits(payment_provider);
CREATE INDEX IF NOT EXISTS idx_deposits_provider_ref ON public.deposits(provider_reference);

-- KYC document enhancements
ALTER TABLE public.kyc_documents
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reason_created ON public.wallet_transactions(reason, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investments_user_status ON public.investments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_user_status ON public.deposits(user_id, status);

-- Audit logs: immutable (no updates/deletes)
CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are immutable';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_mutation();

-- RLS for new tables
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_tx_select ON public.payment_transactions FOR SELECT
  USING (user_id = auth.uid() OR public.has_admin_role());

CREATE POLICY payment_tx_insert_own ON public.payment_transactions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.has_admin_role());

CREATE POLICY payment_tx_update_admin ON public.payment_transactions FOR UPDATE
  USING (public.has_admin_role('finance') OR public.has_admin_role('admin') OR public.has_admin_role('super_admin'));

CREATE POLICY webhook_events_admin ON public.webhook_events FOR ALL
  USING (public.has_admin_role());

-- updated_at on payment_transactions
CREATE TRIGGER payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
