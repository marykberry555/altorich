-- Trigger-only / internal helpers must not be callable via PostgREST RPC.
REVOKE ALL ON FUNCTION public.protect_profile_sensitive_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_sensitive_columns() FROM anon;
REVOKE ALL ON FUNCTION public.protect_profile_sensitive_columns() FROM authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE ALL ON FUNCTION public.notify_admin_on_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admin_on_insert() FROM anon;
REVOKE ALL ON FUNCTION public.notify_admin_on_insert() FROM authenticated;

REVOKE ALL ON FUNCTION public.notify_admin_referral_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admin_referral_insert() FROM anon;
REVOKE ALL ON FUNCTION public.notify_admin_referral_insert() FROM authenticated;

REVOKE ALL ON FUNCTION public.notify_admin_vip_upgrade() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admin_vip_upgrade() FROM anon;
REVOKE ALL ON FUNCTION public.notify_admin_vip_upgrade() FROM authenticated;

REVOKE ALL ON FUNCTION public.record_investment_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_investment_status_change() FROM anon;
REVOKE ALL ON FUNCTION public.record_investment_status_change() FROM authenticated;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- wallet_balance is intentional for authenticated/service_role only
REVOKE ALL ON FUNCTION public.wallet_balance(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wallet_balance(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid) TO service_role;

-- has_admin_role is used by the app for authenticated users
REVOKE ALL ON FUNCTION public.has_admin_role(public.admin_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_admin_role(public.admin_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_admin_role(public.admin_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role(public.admin_role) TO service_role;
