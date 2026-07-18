-- Enrich trusted devices for member settings + stable trust metadata.

ALTER TABLE public.trusted_devices
  ADD COLUMN IF NOT EXISTS device_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS browser TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS operating_system TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS trusted_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trusted_devices_token
  ON public.trusted_devices (trusted_token)
  WHERE trusted_token IS NOT NULL;

COMMENT ON COLUMN public.trusted_devices.trusted_token IS
  'Opaque non-secret device token for display/revocation; trust is keyed by device_fingerprint.';
