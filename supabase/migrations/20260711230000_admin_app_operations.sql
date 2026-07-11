-- Admin App: login activity, admin notifications, push subscription prep

CREATE TABLE IF NOT EXISTS public.login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  operating_system TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_activity_user ON public.login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_created ON public.login_activity(created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON public.admin_notifications(read_at) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (admin_user_id, endpoint)
);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY login_activity_admin_select ON public.login_activity
  FOR SELECT USING (public.has_admin_role());

CREATE POLICY admin_notifications_select ON public.admin_notifications
  FOR SELECT USING (public.has_admin_role());

CREATE POLICY admin_notifications_update ON public.admin_notifications
  FOR UPDATE USING (public.has_admin_role());

CREATE POLICY admin_push_subscriptions_all ON public.admin_push_subscriptions
  FOR ALL USING (admin_user_id = auth.uid() AND public.has_admin_role());

-- Notify admins on operational inserts (no changes to application business logic)
CREATE OR REPLACE FUNCTION public.notify_admin_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_event TEXT;
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    v_event := 'member.registered';
    v_title := 'New member registration';
    v_body := COALESCE(NEW.full_name, NEW.username, 'New member');
  ELSIF TG_TABLE_NAME = 'deposits' THEN
    v_event := 'deposit.requested';
    v_title := 'New funding request';
    v_body := 'Deposit request · ₦' || COALESCE(NEW.amount::text, '0');
  ELSIF TG_TABLE_NAME = 'withdrawals' THEN
    v_event := 'withdrawal.requested';
    v_title := 'New withdrawal request';
    v_body := 'Withdrawal request · ₦' || COALESCE(NEW.amount::text, '0');
  ELSIF TG_TABLE_NAME = 'investments' THEN
    v_event := 'investment.created';
    v_title := 'New investment';
    v_body := 'Investment · ₦' || COALESCE(NEW.amount::text, '0');
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notifications (event_type, title, body, entity_type, entity_id, metadata)
  VALUES (
    v_event,
    v_title,
    v_body,
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object('status', COALESCE(NEW.status::text, ''))
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_admin_notify ON public.profiles;
CREATE TRIGGER profiles_admin_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_insert();

DROP TRIGGER IF EXISTS deposits_admin_notify ON public.deposits;
CREATE TRIGGER deposits_admin_notify
  AFTER INSERT ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_insert();

DROP TRIGGER IF EXISTS withdrawals_admin_notify ON public.withdrawals;
CREATE TRIGGER withdrawals_admin_notify
  AFTER INSERT ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_insert();

DROP TRIGGER IF EXISTS investments_admin_notify ON public.investments;
CREATE TRIGGER investments_admin_notify
  AFTER INSERT ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_insert();
