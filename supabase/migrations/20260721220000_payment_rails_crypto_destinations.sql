-- Payment Rails: crypto destinations + rail metadata
--
-- Live rail toggles already work via public.settings key `payment_rails`
-- without this migration. This migration adds first-class columns/tables
-- for member crypto wallets and deposit/withdrawal rail metadata.

-- 1) Member crypto wallets
CREATE TABLE IF NOT EXISTS public.member_crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_crypto_wallets_user
  ON public.member_crypto_wallets(user_id);

ALTER TABLE public.member_crypto_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY member_crypto_wallets_select
  ON public.member_crypto_wallets FOR SELECT
  USING (user_id = auth.uid() OR public.has_admin_role());

CREATE POLICY member_crypto_wallets_insert
  ON public.member_crypto_wallets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY member_crypto_wallets_update
  ON public.member_crypto_wallets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY member_crypto_wallets_delete
  ON public.member_crypto_wallets FOR DELETE
  USING (user_id = auth.uid());

-- 2) Deposit rail metadata (nullable for backward compatibility)
ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS payment_rail TEXT,
  ADD COLUMN IF NOT EXISTS asset_code TEXT,
  ADD COLUMN IF NOT EXISTS network_code TEXT,
  ADD COLUMN IF NOT EXISTS destination_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3) Withdrawal rail metadata
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS payment_rail TEXT,
  ADD COLUMN IF NOT EXISTS asset_code TEXT,
  ADD COLUMN IF NOT EXISTS network_code TEXT,
  ADD COLUMN IF NOT EXISTS destination_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 4) Extend payment_provider enum when present (safe no-op if type differs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'payment_provider' AND n.nspname = 'public'
  ) THEN
    BEGIN
      ALTER TYPE public.payment_provider ADD VALUE IF NOT EXISTS 'crypto_manual';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE public.payment_provider ADD VALUE IF NOT EXISTS 'nowpayments';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

COMMENT ON TABLE public.member_crypto_wallets IS
  'Member payout crypto destinations for Payment Rails crypto withdrawals.';
