
-- spend_credits: developer bypass
CREATE OR REPLACE FUNCTION public.spend_credits(_amount integer, _reason text, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  bal INTEGER;
  new_balance INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;

  -- Developer bypass: never deduct, return a very large synthetic balance
  IF public.has_role(uid, 'developer') THEN
    INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
    VALUES (uid, 0, _reason || ':developer_bypass', _metadata);
    RETURN 999999999;
  END IF;

  SELECT credits INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  IF bal IS NULL OR bal < _amount THEN
    RETURN -1;
  END IF;
  new_balance := bal - _amount;
  UPDATE public.profiles SET credits = new_balance WHERE id = uid;
  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata) VALUES (uid, -_amount, _reason, _metadata);
  RETURN new_balance;
END $$;

-- handle_new_user: auto-grant developer to designated email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN lower(NEW.email) = 'm26425421@gmail.com' THEN 999999999 ELSE 150 END
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  IF lower(NEW.email) = 'm26425421@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'developer') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
  VALUES (NEW.id, 150, 'signup_bonus', '{"note":"مكافأة التسجيل"}'::jsonb);
  RETURN NEW;
END $$;

-- Retroactively grant developer + admin + big balance if that user already exists
DO $$
DECLARE dev_id uuid;
BEGIN
  SELECT id INTO dev_id FROM auth.users WHERE lower(email) = 'm26425421@gmail.com' LIMIT 1;
  IF dev_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (dev_id, 'developer') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (dev_id, 'admin') ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET credits = 999999999 WHERE id = dev_id;
  END IF;
END $$;
