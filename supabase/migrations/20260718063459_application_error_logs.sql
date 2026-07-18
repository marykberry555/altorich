-- Application error logs for admin review (server-side only; members see reference ID only).

CREATE TABLE IF NOT EXISTS public.application_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'server',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
  message TEXT NOT NULL,
  user_message TEXT,
  code TEXT,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  route TEXT,
  action TEXT,
  request_id TEXT,
  correlation_id TEXT,
  environment TEXT,
  browser TEXT,
  device TEXT,
  user_agent TEXT,
  stack TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_errors_created ON public.application_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_errors_status ON public.application_errors (status);
CREATE INDEX IF NOT EXISTS idx_application_errors_category ON public.application_errors (category);
CREATE INDEX IF NOT EXISTS idx_application_errors_user ON public.application_errors (user_id);
CREATE INDEX IF NOT EXISTS idx_application_errors_reference ON public.application_errors (reference_id);

ALTER TABLE public.application_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY application_errors_admin_select ON public.application_errors
  FOR SELECT USING (public.has_admin_role());

CREATE POLICY application_errors_admin_update ON public.application_errors
  FOR UPDATE USING (public.has_admin_role())
  WITH CHECK (public.has_admin_role());

-- Inserts only via service role (no authenticated insert policy).
REVOKE ALL ON TABLE public.application_errors FROM PUBLIC;
GRANT SELECT, UPDATE ON TABLE public.application_errors TO authenticated;
GRANT ALL ON TABLE public.application_errors TO service_role;
