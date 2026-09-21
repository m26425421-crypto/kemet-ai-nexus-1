CREATE OR REPLACE FUNCTION public.claim_daily_bonus()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
  p RECORD;
  bonus INTEGER;
  new_balance INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT credits, last_daily_bonus_at INTO p FROM public.profiles WHERE id = uid FOR UPDATE;
  IF p.last_daily_bonus_at IS NOT NULL AND p.last_daily_bonus_at = CURRENT_DATE THEN
    RETURN -1;
  END IF;
  SELECT COALESCE((value)::text::int, 10) INTO bonus FROM public.app_settings WHERE key = 'rewards.daily_bonus';
  bonus := COALESCE(bonus, 10);
  new_balance := COALESCE(p.credits,0) + bonus;
  UPDATE public.profiles SET credits = new_balance, last_daily_bonus_at = CURRENT_DATE WHERE id = uid;
  INSERT INTO public.credit_transactions (user_id, amount, reason) VALUES (uid, bonus, 'daily_bonus');
  RETURN new_balance;
END $function$;

INSERT INTO public.app_settings(key, value, description) VALUES
  ('cost.image_realistic', '90'::jsonb, 'تكلفة صورة واقعية'),
  ('cost.image_cinematic', '120'::jsonb, 'تكلفة صورة سينمائية'),
  ('cost.video_600s', '1000'::jsonb, 'تكلفة فيديو 10 دقائق'),
  ('rewards.signup_bonus', '150'::jsonb, 'مكافأة التسجيل')
ON CONFLICT (key) DO NOTHING;