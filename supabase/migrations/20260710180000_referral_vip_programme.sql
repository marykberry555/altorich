-- Referral, VIP & loyalty programme

ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'verified';

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS first_investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS investment_amount NUMERIC(18, 2),
  ADD COLUMN IF NOT EXISTS package_tier TEXT,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE public.vip_levels
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS milestone_bonus NUMERIC(18, 2) NOT NULL DEFAULT 0;

CREATE TYPE public.referral_payout_status AS ENUM (
  'pending',
  'processing',
  'approved',
  'paid',
  'rejected',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('commission', 'milestone', 'recurring')),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON public.referral_rewards(referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral ON public.referral_rewards(referral_id);

CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  status public.referral_payout_status NOT NULL DEFAULT 'pending',
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_account_id UUID,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_payouts_user ON public.referral_payouts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_status ON public.referral_payouts(status);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_rewards_select ON public.referral_rewards FOR SELECT
  USING (referrer_id = auth.uid() OR public.has_admin_role());

CREATE POLICY referral_rewards_insert ON public.referral_rewards FOR INSERT
  WITH CHECK (public.has_admin_role());

CREATE POLICY referral_payouts_select ON public.referral_payouts FOR SELECT
  USING (user_id = auth.uid() OR public.has_admin_role());

CREATE POLICY referral_payouts_insert ON public.referral_payouts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY referral_payouts_update_admin ON public.referral_payouts FOR UPDATE
  USING (public.has_admin_role('finance') OR public.has_admin_role('admin') OR public.has_admin_role('super_admin'));

-- Referral wallet (currency REF) — separate ledger from investment wallet
INSERT INTO public.wallets (user_id, currency)
SELECT p.id, 'REF'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.user_id = p.id AND w.currency = 'REF'
);

-- Backfill referral rows for existing referred members
INSERT INTO public.referrals (referrer_id, referred_id, status)
SELECT p.referred_by, p.id, 'pending'
FROM public.profiles p
WHERE p.referred_by IS NOT NULL
ON CONFLICT (referred_id) DO NOTHING;

-- VIP tier configuration (Starter → Premium)
UPDATE public.profiles SET vip_level = LEAST(vip_level, 3) WHERE vip_level > 3;

DELETE FROM public.vip_levels WHERE level > 3;

INSERT INTO public.vip_levels (level, label, min_members, weekly_dividend, commission_percent, milestone_bonus, perks)
VALUES
  (0, 'Starter', 0, 0, 3, 0, '["Standard referral tools", "Community access"]'),
  (1, 'Growth', 5, 0, 4, 15000, '["Growth badge", "Higher commission"]'),
  (2, 'Elite', 20, 0, 5, 50000, '["Elite badge", "Priority support (coming soon)"]'),
  (3, 'Premium', 50, 0, 6, 200000, '["Premium badge", "Exclusive campaigns (coming soon)"]')
ON CONFLICT (level) DO UPDATE SET
  label = EXCLUDED.label,
  min_members = EXCLUDED.min_members,
  weekly_dividend = 0,
  commission_percent = EXCLUDED.commission_percent,
  milestone_bonus = EXCLUDED.milestone_bonus,
  perks = EXCLUDED.perks;

INSERT INTO public.settings (key, value)
VALUES (
  'referral_program',
  jsonb_build_object(
    'enabled', true,
    'milestone_bonuses_enabled', true,
    'recurring_commissions_enabled', false,
    'min_payout_threshold', 5000,
    'commission_by_package', jsonb_build_object(
      'starter', 3,
      'growth', 4,
      'elite', 5,
      'premium', 6
    )
  )
)
ON CONFLICT (key) DO NOTHING;

-- Profile bootstrap: referral wallet + referral row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_invite_code TEXT;
  ref_code TEXT;
  referrer UUID;
BEGIN
  new_invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  ref_code := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')), '');

  IF ref_code IS NOT NULL THEN
    SELECT id INTO referrer FROM public.profiles WHERE invite_code = ref_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    invite_code,
    username,
    pin_hash,
    referred_by,
    must_change_pin,
    must_change_password,
    email_verified_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    new_invite_code,
    NULLIF(lower(trim(COALESCE(NEW.raw_user_meta_data->>'username', ''))), ''),
    NULLIF(NEW.raw_user_meta_data->>'pin_hash', ''),
    referrer,
    COALESCE((NEW.raw_user_meta_data->>'must_change_pin')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END
  );

  INSERT INTO public.wallets (user_id, currency) VALUES (NEW.id, 'NGN');
  INSERT INTO public.wallets (user_id, currency) VALUES (NEW.id, 'REF');

  IF referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, status)
    VALUES (referrer, NEW.id, 'pending')
    ON CONFLICT (referred_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
