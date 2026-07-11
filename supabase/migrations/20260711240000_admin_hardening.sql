-- Admin hardening: notes, security events, geo fields, realtime, VIP/referral notifications

ALTER TABLE public.login_activity
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS isp TEXT;

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_member ON public.admin_notes(member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address INET,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_notes_admin_all ON public.admin_notes
  FOR ALL USING (public.has_admin_role()) WITH CHECK (public.has_admin_role());

CREATE POLICY security_events_admin_select ON public.security_events
  FOR SELECT USING (public.has_admin_role());

-- Realtime for admin operations console
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.login_activity;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Referral + VIP upgrade admin notifications
CREATE OR REPLACE FUNCTION public.notify_admin_referral_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (event_type, title, body, entity_type, entity_id, metadata)
  VALUES (
    'referral.created',
    'New referral',
    'Referral link used · member ' || COALESCE(NEW.referred_id::text, ''),
    'referrals',
    NEW.id,
    jsonb_build_object('referrer_id', NEW.referrer_id, 'referred_id', NEW.referred_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referrals_admin_notify ON public.referrals;
CREATE TRIGGER referrals_admin_notify
  AFTER INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_referral_insert();

CREATE OR REPLACE FUNCTION public.notify_admin_vip_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.vip_level IS DISTINCT FROM NEW.vip_level AND NEW.vip_level > COALESCE(OLD.vip_level, 0) THEN
    INSERT INTO public.admin_notifications (event_type, title, body, entity_type, entity_id, metadata)
    VALUES (
      'vip.upgraded',
      'VIP level upgrade',
      COALESCE(NEW.full_name, NEW.username, 'Member') || ' reached VIP ' || NEW.vip_level::text,
      'profiles',
      NEW.id,
      jsonb_build_object('vip_level', NEW.vip_level, 'previous', OLD.vip_level)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_vip_admin_notify ON public.profiles;
CREATE TRIGGER profiles_vip_admin_notify
  AFTER UPDATE OF vip_level ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_vip_upgrade();
