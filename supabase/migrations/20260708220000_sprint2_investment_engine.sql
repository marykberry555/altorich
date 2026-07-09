-- Sprint 2: Investment engine, extended plans, status history, profile prefs

-- Enums
DO $$ BEGIN
  CREATE TYPE public.settlement_frequency AS ENUM ('daily', 'weekly', 'monthly', 'maturity');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_visibility AS ENUM ('public', 'members', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_status AS ENUM ('draft', 'active', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend investment_status
ALTER TYPE public.investment_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.investment_status ADD VALUE IF NOT EXISTS 'matured';
ALTER TYPE public.investment_status ADD VALUE IF NOT EXISTS 'closed';

-- Extend withdrawal_status
ALTER TYPE public.withdrawal_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Extend deposit_status (verified = admin approved, completed = wallet credited)
ALTER TYPE public.deposit_status ADD VALUE IF NOT EXISTS 'completed';

-- Investment plans: full catalog fields
ALTER TABLE public.investment_plans
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS min_investment NUMERIC(18, 2),
  ADD COLUMN IF NOT EXISTS max_investment NUMERIC(18, 2),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS settlement_frequency public.settlement_frequency NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS plan_status public.plan_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS risk_disclosure TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS visibility public.plan_visibility NOT NULL DEFAULT 'public';

UPDATE public.investment_plans
SET
  min_investment = COALESCE(min_investment, price),
  max_investment = COALESCE(max_investment, price * 5),
  category = tier,
  risk_disclosure = 'Returns are cooperative estimates, not guarantees. Capital is subject to pool performance and admin-approved settlements.'
WHERE min_investment IS NULL OR max_investment IS NULL;

ALTER TABLE public.investment_plans
  ALTER COLUMN min_investment SET NOT NULL,
  ALTER COLUMN max_investment SET NOT NULL;

ALTER TABLE public.investment_plans
  ADD CONSTRAINT investment_plans_min_max CHECK (min_investment > 0 AND max_investment >= min_investment);

-- Investments: reference + settlement tracking
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS settlement_frequency public.settlement_frequency,
  ADD COLUMN IF NOT EXISTS matured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_earned NUMERIC(18, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_investments_reference ON public.investments(reference);

-- Status change audit trail
CREATE TABLE IF NOT EXISTS public.investment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  from_status public.investment_status,
  to_status public.investment_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_status_history_investment
  ON public.investment_status_history(investment_id);

ALTER TABLE public.investment_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY investment_status_history_select ON public.investment_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investments i
      WHERE i.id = investment_id AND (i.user_id = auth.uid() OR public.has_admin_role())
    )
  );

CREATE POLICY investment_status_history_insert_admin ON public.investment_status_history FOR INSERT
  WITH CHECK (public.has_admin_role() OR changed_by = auth.uid());

-- Profile notification preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "sms": false}'::jsonb;

-- Settlement admin insert (for engine via service role)
CREATE POLICY settlements_insert_admin ON public.investment_settlements FOR INSERT
  WITH CHECK (public.has_admin_role());

CREATE POLICY settlements_update_admin ON public.investment_settlements FOR UPDATE
  USING (public.has_admin_role('finance') OR public.has_admin_role('admin') OR public.has_admin_role('super_admin'));

-- Notifications insert for system (service role bypasses RLS)
CREATE POLICY notifications_insert_system ON public.notifications FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.has_admin_role());

-- Record investment status transitions
CREATE OR REPLACE FUNCTION public.record_investment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.investment_status_history (investment_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.investment_status_history (investment_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS investments_status_history ON public.investments;
CREATE TRIGGER investments_status_history
  AFTER INSERT OR UPDATE OF status ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.record_investment_status_change();
