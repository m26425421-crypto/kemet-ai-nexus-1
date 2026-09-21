
-- 1) app_settings: single source of truth for tunable values
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read settings" ON public.app_settings
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "admin write settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) banned flag on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;

-- 3) Seed default settings (idempotent)
INSERT INTO public.app_settings (key, value, description) VALUES
  ('rewards.signup_bonus',    '150'::jsonb, 'مكافأة التسجيل'),
  ('rewards.daily_bonus',     '100'::jsonb, 'المكافأة اليومية'),
  ('rewards.invite_bonus',    '100'::jsonb, 'مكافأة دعوة صديق'),
  ('ads.daily_limit',         '10'::jsonb,  'الحد الأقصى للإعلانات اليومية'),
  ('ads.credits_per_ad',      '5'::jsonb,   'الكريدت لكل إعلان'),
  ('cost.image_fast',         '20'::jsonb,  'تكلفة صورة سريعة'),
  ('cost.image_standard',     '40'::jsonb,  'تكلفة صورة قياسية'),
  ('cost.image_pro',          '60'::jsonb,  'تكلفة صورة احترافية'),
  ('cost.image_ultra',        '100'::jsonb, 'تكلفة صورة Ultra'),
  ('cost.video_6s',           '25'::jsonb,  'تكلفة فيديو 6 ثواني'),
  ('cost.video_30s',          '50'::jsonb,  'تكلفة فيديو 30 ثانية'),
  ('cost.video_60s',          '100'::jsonb, 'تكلفة فيديو 60 ثانية'),
  ('cost.video_180s',         '300'::jsonb, 'تكلفة فيديو 3 دقائق'),
  ('cost.video_300s',         '500'::jsonb, 'تكلفة فيديو 5 دقائق'),
  ('cost.tts_short',          '10'::jsonb,  'تكلفة صوت قصير'),
  ('cost.tts_medium',         '20'::jsonb,  'تكلفة صوت متوسط'),
  ('cost.tts_long',           '40'::jsonb,  'تكلفة صوت طويل'),
  ('cost.stt',                '10'::jsonb,  'تكلفة تحويل الكلام لنص'),
  ('cost.vision',             '15'::jsonb,  'تكلفة تحليل صورة'),
  ('cost.translation',        '5'::jsonb,   'تكلفة ترجمة'),
  ('cost.summarizer',         '10'::jsonb,  'تكلفة تلخيص'),
  ('cost.programming',        '15'::jsonb,  'تكلفة مساعد برمجي'),
  ('cost.creator',            '20'::jsonb,  'تكلفة استوديو صانع المحتوى'),
  ('features.chat',           'true'::jsonb,  'تفعيل المحادثة'),
  ('features.images',         'true'::jsonb,  'تفعيل توليد الصور'),
  ('features.videos',         'true'::jsonb,  'تفعيل استوديو الفيديو'),
  ('features.tts',            'true'::jsonb,  'تفعيل تحويل النص لصوت'),
  ('features.stt',            'true'::jsonb,  'تفعيل تحويل الكلام لنص'),
  ('features.vision',         'true'::jsonb,  'تفعيل تحليل الصور'),
  ('features.translation',    'true'::jsonb,  'تفعيل الترجمة'),
  ('features.summarizer',     'true'::jsonb,  'تفعيل التلخيص'),
  ('features.programming',    'true'::jsonb,  'تفعيل مساعد البرمجة'),
  ('features.creator',        'true'::jsonb,  'تفعيل استوديو صانع المحتوى'),
  ('features.islamic',        'true'::jsonb,  'تفعيل الاستوديو الإسلامي'),
  ('features.study',          'true'::jsonb,  'تفعيل الاستوديو التعليمي'),
  ('features.store',          'true'::jsonb,  'تفعيل المتجر'),
  ('plans.plus.price',        '20'::jsonb,  'سعر خطة Plus بالدولار'),
  ('plans.plus.credits',      '2500'::jsonb,'كريدت شهري لخطة Plus'),
  ('plans.pro.price',         '35'::jsonb,  'سعر خطة Pro'),
  ('plans.pro.credits',       '5000'::jsonb,'كريدت شهري لخطة Pro'),
  ('plans.ultra.price',       '60'::jsonb,  'سعر خطة Ultra'),
  ('plans.ultra.credits',     '8000'::jsonb,'كريدت شهري لخطة Ultra')
ON CONFLICT (key) DO NOTHING;

-- 4) Admin RPC functions (security definer, role-checked)
CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT '', _limit int DEFAULT 100, _offset int DEFAULT 0)
RETURNS TABLE (
  id uuid, email text, full_name text, credits int, plan subscription_plan,
  banned boolean, created_at timestamptz, roles text[]
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.credits, p.plan, p.banned, p.created_at,
      COALESCE(ARRAY_AGG(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::text[])
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE _search = '' OR p.email ILIKE '%'||_search||'%' OR p.full_name ILIKE '%'||_search||'%'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT _limit OFFSET _offset;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_credits(_user_id uuid, _credits int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET credits = GREATEST(_credits, 0) WHERE id = _user_id;
  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
  VALUES (_user_id, 0, 'admin_set_credits', jsonb_build_object('new_balance', _credits, 'by', auth.uid()));
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_plan(_user_id uuid, _plan subscription_plan)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET plan = _plan WHERE id = _user_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_banned(_user_id uuid, _banned boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET banned = _banned WHERE id = _user_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_setting(_key text, _value jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.app_settings (key, value, updated_at, updated_by)
  VALUES (_key, _value, now(), auth.uid())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'banned_users', (SELECT count(*) FROM public.profiles WHERE banned),
    'total_images', (SELECT count(*) FROM public.generated_images),
    'total_messages', (SELECT count(*) FROM public.chat_messages),
    'signups_today', (SELECT count(*) FROM public.profiles WHERE created_at::date = CURRENT_DATE),
    'active_today', (SELECT count(DISTINCT user_id) FROM public.credit_transactions WHERE created_at::date = CURRENT_DATE),
    'credits_spent_today', (SELECT COALESCE(-SUM(amount),0) FROM public.credit_transactions WHERE amount < 0 AND created_at::date = CURRENT_DATE),
    'by_plan', (SELECT jsonb_object_agg(plan, cnt) FROM (SELECT plan, count(*) cnt FROM public.profiles GROUP BY plan) s)
  ) INTO r;
  RETURN r;
END $$;
