
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.claim_daily_bonus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_daily_bonus() TO authenticated;

REVOKE ALL ON FUNCTION public.spend_credits(INTEGER, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_credits(INTEGER, TEXT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
