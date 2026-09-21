
REVOKE EXECUTE ON FUNCTION public.admin_list_users(text, int, int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_credits(uuid, int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_plan(uuid, subscription_plan) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_banned(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_setting(text, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_credits(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_plan(uuid, subscription_plan) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_banned(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_setting(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;
