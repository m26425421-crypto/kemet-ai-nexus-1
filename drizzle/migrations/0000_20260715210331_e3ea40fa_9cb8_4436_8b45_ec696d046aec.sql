
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'plus', 'pro', 'ultra');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'ar',
  theme TEXT NOT NULL DEFAULT 'dark',
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  credits INTEGER NOT NULL DEFAULT 0,
  last_daily_bonus_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- ============ CREDIT TRANSACTIONS ============
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
CREATE INDEX idx_credit_tx_user ON public.credit_transactions(user_id, created_at DESC);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx select" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ CHAT ============
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'محادثة جديدة',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
CREATE INDEX idx_chat_conv_user ON public.chat_conversations(user_id, updated_at DESC);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conv all" ON public.chat_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
CREATE INDEX idx_chat_msg_conv ON public.chat_messages(conversation_id, created_at ASC);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msg all" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ GENERATED IMAGES ============
CREATE TABLE public.generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_data TEXT NOT NULL,
  quality TEXT NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.generated_images TO authenticated;
GRANT ALL ON public.generated_images TO service_role;
CREATE INDEX idx_gen_img_user ON public.generated_images(user_id, created_at DESC);
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own img all" ON public.generated_images FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TIMESTAMPS TRIGGER ============
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_chat_conv_touch BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ============ NEW USER TRIGGER: profile + signup bonus + user role ============
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    150
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
  VALUES (NEW.id, 150, 'signup_bonus', '{"note":"مكافأة التسجيل"}'::jsonb);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ CREDIT FUNCTIONS ============
-- Daily bonus (10 credits). Returns new balance or -1 if already claimed today.
CREATE OR REPLACE FUNCTION public.claim_daily_bonus() RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  p RECORD;
  new_balance INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT credits, last_daily_bonus_at INTO p FROM public.profiles WHERE id = uid FOR UPDATE;
  IF p.last_daily_bonus_at IS NOT NULL AND p.last_daily_bonus_at = CURRENT_DATE THEN
    RETURN -1;
  END IF;
  new_balance := COALESCE(p.credits,0) + 10;
  UPDATE public.profiles SET credits = new_balance, last_daily_bonus_at = CURRENT_DATE WHERE id = uid;
  INSERT INTO public.credit_transactions (user_id, amount, reason) VALUES (uid, 10, 'daily_bonus');
  RETURN new_balance;
END $$;
GRANT EXECUTE ON FUNCTION public.claim_daily_bonus() TO authenticated;

-- Spend credits (atomic). Returns new balance or -1 if insufficient.
CREATE OR REPLACE FUNCTION public.spend_credits(_amount INTEGER, _reason TEXT, _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  bal INTEGER;
  new_balance INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  SELECT credits INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  IF bal IS NULL OR bal < _amount THEN
    RETURN -1;
  END IF;
  new_balance := bal - _amount;
  UPDATE public.profiles SET credits = new_balance WHERE id = uid;
  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata) VALUES (uid, -_amount, _reason, _metadata);
  RETURN new_balance;
END $$;
GRANT EXECUTE ON FUNCTION public.spend_credits(INTEGER, TEXT, JSONB) TO authenticated;

-- Refund credits (used on failed image gen). Server-role only via SECURITY DEFINER + explicit user check.
CREATE OR REPLACE FUNCTION public.refund_credits(_user_id UUID, _amount INTEGER, _reason TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_balance INTEGER;
BEGIN
  UPDATE public.profiles SET credits = credits + _amount WHERE id = _user_id RETURNING credits INTO new_balance;
  INSERT INTO public.credit_transactions (user_id, amount, reason) VALUES (_user_id, _amount, _reason);
  RETURN new_balance;
END $$;
REVOKE ALL ON FUNCTION public.refund_credits(UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_credits(UUID, INTEGER, TEXT) TO service_role;
