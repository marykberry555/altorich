-- Auth architecture: username + pin, OTP, trusted devices, forced credential change

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS must_change_pin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

DO $$ BEGIN
  CREATE TYPE public.auth_otp_purpose AS ENUM (
    'register',
    'login_device',
    'recover_pin',
    'recover_username'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.auth_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose public.auth_otp_purpose NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_email ON public.auth_otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires ON public.auth_otps(expires_at);

CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT '',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON public.trusted_devices(user_id);

-- Extend profile creation with username from metadata
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

  INSERT INTO public.wallets (user_id, currency)
  VALUES (NEW.id, 'NGN');

  RETURN NEW;
END;
$$;

ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_otps_service ON public.auth_otps FOR ALL
  USING (public.has_admin_role());

CREATE POLICY trusted_devices_own ON public.trusted_devices FOR SELECT
  USING (user_id = auth.uid() OR public.has_admin_role());

CREATE POLICY trusted_devices_manage_own ON public.trusted_devices FOR ALL
  USING (user_id = auth.uid() OR public.has_admin_role());
