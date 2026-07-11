-- Platform funding accounts (admin-managed receiving banks for member deposits)

CREATE TYPE public.funding_account_status AS ENUM ('active', 'inactive', 'maintenance');

CREATE TABLE public.funding_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  sort_code TEXT,
  display_name TEXT,
  funding_instructions TEXT,
  display_order INT NOT NULL DEFAULT 0,
  status public.funding_account_status NOT NULL DEFAULT 'active',
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_funding_accounts_status ON public.funding_accounts(status);
CREATE INDEX idx_funding_accounts_order ON public.funding_accounts(display_order ASC, created_at ASC);

ALTER TABLE public.funding_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY funding_accounts_select_active ON public.funding_accounts
  FOR SELECT
  USING (status = 'active' OR public.has_admin_role());

CREATE POLICY funding_accounts_manage ON public.funding_accounts
  FOR ALL
  USING (public.has_admin_role('admin') OR public.has_admin_role('finance') OR public.has_admin_role('super_admin'));

-- Seed from legacy switchboard defaults
INSERT INTO public.funding_accounts (
  bank_name,
  account_name,
  account_number,
  funding_instructions,
  display_order,
  status,
  is_preferred
) VALUES (
  'Configure in admin',
  'ALTORICH LTD',
  '00000000',
  'Send the exact amount, then submit your transfer reference for verification.',
  0,
  'active',
  true
);
