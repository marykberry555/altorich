-- AltoRich Foundation Schema
-- ALTORICH LTD · Company No. 13579416

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin', 'finance', 'support');
CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
CREATE TYPE public.deposit_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
CREATE TYPE public.investment_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.settlement_status AS ENUM ('scheduled', 'paid', 'skipped');
CREATE TYPE public.referral_status AS ENUM ('pending', 'qualified', 'paid');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.notification_channel AS ENUM ('in_app', 'email', 'sms', 'whatsapp', 'push');
CREATE TYPE public.wallet_reason AS ENUM (
  'deposit',
  'withdrawal',
  'investment_purchase',
  'investment_settlement',
  'referral_commission',
  'vip_dividend',
  'bonus',
  'adjustment',
  'reversal'
);

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vip_level SMALLINT NOT NULL DEFAULT 0 CHECK (vip_level >= 0),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_invite_code ON public.profiles(invite_code);
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by);

-- Admin roles (authorization in app_metadata preferred; this table for granular RBAC)
CREATE TABLE public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.admin_role NOT NULL,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_admin_roles_user ON public.admin_roles(user_id);

-- Platform settings (key-value)
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- VIP level configuration
CREATE TABLE public.vip_levels (
  level SMALLINT PRIMARY KEY CHECK (level >= 0),
  label TEXT NOT NULL,
  min_members INTEGER NOT NULL DEFAULT 0,
  weekly_dividend NUMERIC(18, 2) NOT NULL DEFAULT 0,
  perks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets (one per user per currency)
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);

CREATE INDEX idx_wallets_user ON public.wallets(user_id);

-- Ledger — never mutate balance directly
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  type public.transaction_type NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  reference TEXT NOT NULL,
  reason public.wallet_reason NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reference)
);

CREATE INDEX idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_status ON public.wallet_transactions(status);
CREATE INDEX idx_wallet_tx_created ON public.wallet_transactions(created_at DESC);

-- Investment plans (catalog)
CREATE TABLE public.investment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'growth', 'premium')),
  price NUMERIC(18, 2) NOT NULL CHECK (price > 0),
  cycle_days INTEGER NOT NULL CHECK (cycle_days > 0),
  projected_daily NUMERIC(18, 2) NOT NULL DEFAULT 0,
  first_bonus NUMERIC(18, 2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Member investments
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES public.investment_plans(id) ON DELETE RESTRICT,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  status public.investment_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investments_user ON public.investments(user_id);
CREATE INDEX idx_investments_status ON public.investments(status);

-- Settlement schedule
CREATE TABLE public.investment_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
  scheduled_for DATE NOT NULL,
  status public.settlement_status NOT NULL DEFAULT 'scheduled',
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX idx_settlements_investment ON public.investment_settlements(investment_id);
CREATE INDEX idx_settlements_scheduled ON public.investment_settlements(scheduled_for);

-- Deposits (bank transfer verification)
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  reference TEXT NOT NULL UNIQUE,
  receipt_note TEXT NOT NULL DEFAULT '',
  proof_url TEXT,
  status public.deposit_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_deposits_user ON public.deposits(user_id);
CREATE INDEX idx_deposits_status ON public.deposits(status);
CREATE INDEX idx_deposits_created ON public.deposits(created_at DESC);

-- Bank accounts
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_accounts_user ON public.bank_accounts(user_id);

-- Withdrawals
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);

-- Referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.referral_status NOT NULL DEFAULT 'pending',
  commission_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  qualified_at TIMESTAMPTZ,
  UNIQUE (referred_id)
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- Audit logs (admin actions)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Activity logs (member actions)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);

-- KYC documents
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_kyc_user ON public.kyc_documents(user_id);

-- Helper: check admin role
CREATE OR REPLACE FUNCTION public.has_admin_role(check_role public.admin_role DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid()
    AND (check_role IS NULL OR ar.role = check_role)
  );
$$;

-- Helper: wallet balance from ledger
CREATE OR REPLACE FUNCTION public.wallet_balance(p_wallet_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
  (
    SELECT SUM(
      CASE
        WHEN type = 'credit' AND status = 'completed' THEN amount
        WHEN type = 'debit' AND status = 'completed' THEN -amount
        ELSE 0
      END
    )
    FROM public.wallet_transactions
    WHERE wallet_id = p_wallet_id
  ),
  0
  );
$$;

-- Auto-create profile + wallet on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_invite_code TEXT;
BEGIN
  new_invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.profiles (id, full_name, phone, invite_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    new_invite_code
  );

  INSERT INTO public.wallets (user_id, currency)
  VALUES (NEW.id, 'NGN');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER investment_plans_updated_at BEFORE UPDATE ON public.investment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER investments_updated_at BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (id = auth.uid() OR public.has_admin_role());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Admin roles: admins read all, super_admin manages
CREATE POLICY admin_roles_select ON public.admin_roles FOR SELECT USING (public.has_admin_role());
CREATE POLICY admin_roles_manage ON public.admin_roles FOR ALL USING (public.has_admin_role('super_admin'));

-- Settings: public read for non-sensitive keys via service; members read published
CREATE POLICY settings_select ON public.settings FOR SELECT USING (true);
CREATE POLICY settings_manage ON public.settings FOR ALL USING (public.has_admin_role('super_admin') OR public.has_admin_role('admin'));

-- VIP levels: public read
CREATE POLICY vip_levels_select ON public.vip_levels FOR SELECT USING (true);
CREATE POLICY vip_levels_manage ON public.vip_levels FOR ALL USING (public.has_admin_role());

-- Wallets
CREATE POLICY wallets_select_own ON public.wallets FOR SELECT USING (user_id = auth.uid() OR public.has_admin_role());
CREATE POLICY wallets_insert_system ON public.wallets FOR INSERT WITH CHECK (user_id = auth.uid());

-- Wallet transactions
CREATE POLICY wallet_tx_select ON public.wallet_transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND (w.user_id = auth.uid() OR public.has_admin_role()))
  );
CREATE POLICY wallet_tx_insert_admin ON public.wallet_transactions FOR INSERT
  WITH CHECK (public.has_admin_role('finance') OR public.has_admin_role('admin') OR public.has_admin_role('super_admin'));

-- Investment plans: public read active
CREATE POLICY plans_select ON public.investment_plans FOR SELECT USING (is_active = true OR public.has_admin_role());
CREATE POLICY plans_manage ON public.investment_plans FOR ALL USING (public.has_admin_role());

-- Investments
CREATE POLICY investments_select_own ON public.investments FOR SELECT USING (user_id = auth.uid() OR public.has_admin_role());
CREATE POLICY investments_insert_own ON public.investments FOR INSERT WITH CHECK (user_id = auth.uid());

-- Settlements
CREATE POLICY settlements_select ON public.investment_settlements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.investments i WHERE i.id = investment_id AND (i.user_id = auth.uid() OR public.has_admin_role()))
  );

-- Deposits
CREATE POLICY deposits_select ON public.deposits FOR SELECT
  USING (user_id = auth.uid() OR public.has_admin_role() OR user_id IS NULL);
CREATE POLICY deposits_insert ON public.deposits FOR INSERT WITH CHECK (true);
CREATE POLICY deposits_update_admin ON public.deposits FOR UPDATE USING (public.has_admin_role('finance') OR public.has_admin_role('admin') OR public.has_admin_role('super_admin'));

-- Bank accounts
CREATE POLICY bank_accounts_select ON public.bank_accounts FOR SELECT USING (user_id = auth.uid() OR public.has_admin_role());
CREATE POLICY bank_accounts_insert ON public.bank_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY bank_accounts_update ON public.bank_accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY bank_accounts_delete ON public.bank_accounts FOR DELETE USING (user_id = auth.uid());

-- Withdrawals
CREATE POLICY withdrawals_select ON public.withdrawals FOR SELECT USING (user_id = auth.uid() OR public.has_admin_role());
CREATE POLICY withdrawals_insert ON public.withdrawals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY withdrawals_update_admin ON public.withdrawals FOR UPDATE
  USING (public.has_admin_role('finance') OR public.has_admin_role('admin') OR public.has_admin_role('super_admin'));

-- Referrals
CREATE POLICY referrals_select ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.has_admin_role());

-- Notifications
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Audit logs: admin only
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT USING (public.has_admin_role());
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK (public.has_admin_role() OR actor_id = auth.uid());

-- Activity logs
CREATE POLICY activity_logs_select ON public.activity_logs FOR SELECT USING (user_id = auth.uid() OR public.has_admin_role());
CREATE POLICY activity_logs_insert ON public.activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());

-- KYC
CREATE POLICY kyc_select ON public.kyc_documents FOR SELECT USING (user_id = auth.uid() OR public.has_admin_role());
CREATE POLICY kyc_insert ON public.kyc_documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY kyc_update_admin ON public.kyc_documents FOR UPDATE USING (public.has_admin_role());

-- Seed VIP levels
INSERT INTO public.vip_levels (level, label, min_members, weekly_dividend, perks) VALUES
  (0, 'Member', 0, 0, '["Community access", "Standard withdrawal windows"]'),
  (1, 'Bronze', 3, 500, '["Priority support", "Bronze welfare pool"]'),
  (2, 'Silver', 10, 1500, '["Silver welfare products", "Faster verification"]'),
  (3, 'Gold', 25, 5000, '["Gold dividend pool", "Dedicated account manager"]'),
  (4, 'Platinum', 50, 12000, '["Platinum events", "Early cycle access"]');

-- Seed platform settings
INSERT INTO public.settings (key, value) VALUES
  ('platform', jsonb_build_object(
    'brand', 'AltoRich',
    'legal_name', 'ALTORICH LTD',
    'company_number', '13579416',
    'domain', 'altorich.com'
  )),
  ('bank_switchboard', jsonb_build_object(
    'active_bank_name', 'Configure in admin',
    'active_account_name', 'ALTORICH LTD',
    'active_account_number', '00000000',
    'payment_instruction', 'Send the exact amount, then submit your transfer reference for verification.',
    'transfer_narration', 'Use your registered phone number as transfer narration.',
    'contributions_enabled', true
  )),
  ('announcements', jsonb_build_object(
    'global', 'AltoRich is onboarding verified members. All contributions are subject to approval and cooperative rules.'
  )),
  ('withdrawal_windows', jsonb_build_object(
    'description', 'Mondays and Thursdays from 8:00 AM WAT',
    'weekdays', jsonb_build_array('Monday', 'Thursday'),
    'start_hour', 8,
    'timezone', 'Africa/Lagos'
  ));

-- Seed investment plans
INSERT INTO public.investment_plans (slug, name, tier, price, cycle_days, projected_daily, first_bonus, description, sort_order) VALUES
  ('alto-a', 'Alto Starter A', 'starter', 3000, 90, 45, 150, 'Entry cooperative cycle for new verified members.', 1),
  ('alto-b', 'Alto Starter B', 'starter', 6000, 90, 90, 200, 'Balanced starter cycle with documented settlement windows.', 2),
  ('alto-c', 'Alto Growth C', 'growth', 12000, 60, 180, 300, 'Mid-tier community pool with transparent ledger reporting.', 3),
  ('alto-d', 'Alto Growth D', 'growth', 25000, 60, 375, 500, 'Structured growth cycle for active participants.', 4),
  ('alto-e', 'Alto Premium E', 'premium', 50000, 45, 800, 1000, 'Premium cycle with priority withdrawal review.', 5),
  ('alto-f', 'Alto Premium F', 'premium', 100000, 45, 1600, 2000, 'High-commitment pool for established members.', 6);

-- Storage buckets (run via dashboard or separate migration)
-- deposit-proofs, avatars, kyc-documents
