-- Production security hardening: block PostgREST pin_hash reads and lock settlement counters.

-- ---------------------------------------------------------------------------
-- 1. Column-level protection for profiles.pin_hash
--    Server-side auth uses service_role; members must never read the hash.
-- ---------------------------------------------------------------------------
REVOKE SELECT (pin_hash) ON TABLE public.profiles FROM anon;
REVOKE SELECT (pin_hash) ON TABLE public.profiles FROM authenticated;
REVOKE UPDATE (pin_hash) ON TABLE public.profiles FROM anon;
REVOKE UPDATE (pin_hash) ON TABLE public.profiles FROM authenticated;

GRANT SELECT (pin_hash) ON TABLE public.profiles TO service_role;
GRANT UPDATE (pin_hash) ON TABLE public.profiles TO service_role;

-- ---------------------------------------------------------------------------
-- 2. settlement_reference_counters — internal sequence table (service_role only)
-- ---------------------------------------------------------------------------
ALTER TABLE public.settlement_reference_counters ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.settlement_reference_counters FROM anon;
REVOKE ALL ON TABLE public.settlement_reference_counters FROM authenticated;

GRANT ALL ON TABLE public.settlement_reference_counters TO service_role;
