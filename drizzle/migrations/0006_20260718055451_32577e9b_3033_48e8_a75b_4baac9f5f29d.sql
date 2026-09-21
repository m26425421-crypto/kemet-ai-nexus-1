
-- ============ MARKETPLACE ============
CREATE TABLE public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  product_type TEXT NOT NULL,
  price_credits INTEGER NOT NULL CHECK (price_credits >= 0),
  cover_url TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_url TEXT,
  demo_url TEXT,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|archived
  sales_count INTEGER NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_products TO authenticated;
GRANT SELECT ON public.marketplace_products TO anon;
GRANT ALL ON public.marketplace_products TO service_role;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved products are public" ON public.marketplace_products FOR SELECT USING (status = 'approved' OR seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "seller manages own products" ON public.marketplace_products FOR ALL TO authenticated USING (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER mp_products_touch BEFORE UPDATE ON public.marketplace_products FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE INDEX idx_mp_products_status ON public.marketplace_products(status, created_at DESC);
CREATE INDEX idx_mp_products_category ON public.marketplace_products(category);
CREATE INDEX idx_mp_products_seller ON public.marketplace_products(seller_id);

CREATE TABLE public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE RESTRICT,
  amount_credits INTEGER NOT NULL,
  commission_credits INTEGER NOT NULL,
  seller_credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- completed|refunded
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.marketplace_orders TO authenticated;
GRANT ALL ON public.marketplace_orders TO service_role;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders visible" ON public.marketplace_orders FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_reviews TO authenticated;
GRANT SELECT ON public.marketplace_reviews TO anon;
GRANT ALL ON public.marketplace_reviews TO service_role;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews are public" ON public.marketplace_reviews FOR SELECT USING (true);
CREATE POLICY "user manages own review" ON public.marketplace_reviews FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.marketplace_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.marketplace_favorites TO authenticated;
GRANT ALL ON public.marketplace_favorites TO service_role;
ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites" ON public.marketplace_favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.marketplace_follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, seller_id)
);
GRANT SELECT, INSERT, DELETE ON public.marketplace_follows TO authenticated;
GRANT ALL ON public.marketplace_follows TO service_role;
ALTER TABLE public.marketplace_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows visible to owner" ON public.marketplace_follows FOR SELECT TO authenticated USING (follower_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "own follow write" ON public.marketplace_follows FOR ALL TO authenticated USING (follower_id = auth.uid()) WITH CHECK (follower_id = auth.uid());

CREATE TABLE public.seller_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_credits INTEGER NOT NULL DEFAULT 0,
  lifetime_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seller_balances TO authenticated;
GRANT ALL ON public.seller_balances TO service_role;
ALTER TABLE public.seller_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own balance" ON public.seller_balances FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_credits INTEGER NOT NULL CHECK (amount_credits > 0),
  method TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|paid
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.seller_payouts TO authenticated;
GRANT ALL ON public.seller_payouts TO service_role;
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payouts" ON public.seller_payouts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user creates payout" ON public.seller_payouts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE TRIGGER seller_payouts_touch BEFORE UPDATE ON public.seller_payouts FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ============ AD WATCH ============
CREATE TABLE public.ad_watch_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, section, day)
);
GRANT SELECT ON public.ad_watch_daily TO authenticated;
GRANT ALL ON public.ad_watch_daily TO service_role;
ALTER TABLE public.ad_watch_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ad counts" ON public.ad_watch_daily FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.spend_or_watch_ad(_cost INTEGER, _section TEXT, _reason TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  bal INTEGER;
  ads_needed INTEGER;
  ads_today INTEGER;
  daily_cap INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF public.has_role(uid,'developer') THEN
    RETURN jsonb_build_object('ok', true, 'mode','developer', 'balance', 999999999);
  END IF;
  SELECT credits INTO bal FROM public.profiles WHERE id = uid;
  IF bal >= _cost THEN
    UPDATE public.profiles SET credits = credits - _cost WHERE id = uid;
    INSERT INTO public.credit_transactions(user_id, amount, reason, metadata) VALUES (uid, -_cost, _reason, jsonb_build_object('section',_section));
    RETURN jsonb_build_object('ok', true, 'mode','paid', 'balance', bal - _cost);
  END IF;
  ads_needed := CASE WHEN _cost <= 100 THEN 1 ELSE 3 END;
  SELECT COALESCE(count,0) INTO ads_today FROM public.ad_watch_daily WHERE user_id = uid AND section = _section AND day = CURRENT_DATE;
  SELECT COALESCE((value)::text::int, 10) INTO daily_cap FROM public.app_settings WHERE key = 'ads.daily_cap_per_section';
  IF ads_today + ads_needed > daily_cap THEN
    RETURN jsonb_build_object('ok', false, 'reason','ads_daily_cap', 'ads_today', ads_today, 'cap', daily_cap);
  END IF;
  RETURN jsonb_build_object('ok', false, 'reason','need_ads', 'ads_needed', ads_needed, 'ads_today', ads_today, 'cap', daily_cap, 'balance', bal, 'cost', _cost);
END $$;

CREATE OR REPLACE FUNCTION public.record_ad_watch(_section TEXT, _count INTEGER DEFAULT 1)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  new_count INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.ad_watch_daily(user_id, section, day, count)
  VALUES (uid, _section, CURRENT_DATE, _count)
  ON CONFLICT (user_id, section, day) DO UPDATE SET count = ad_watch_daily.count + EXCLUDED.count
  RETURNING count INTO new_count;
  RETURN new_count;
END $$;

CREATE OR REPLACE FUNCTION public.mp_purchase(_product_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  prod RECORD;
  bal INTEGER;
  commission_pct NUMERIC;
  commission INTEGER;
  seller_cut INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO prod FROM public.marketplace_products WHERE id = _product_id AND status = 'approved';
  IF prod IS NULL THEN RAISE EXCEPTION 'product not available'; END IF;
  IF prod.seller_id = uid THEN RAISE EXCEPTION 'cannot buy own product'; END IF;
  IF EXISTS (SELECT 1 FROM public.marketplace_orders WHERE buyer_id = uid AND product_id = _product_id AND status = 'completed') THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;
  SELECT COALESCE((value)::text::numeric, 10) INTO commission_pct FROM public.app_settings WHERE key = 'marketplace.commission_pct';
  commission := FLOOR(prod.price_credits * commission_pct / 100.0)::int;
  seller_cut := prod.price_credits - commission;

  IF NOT public.has_role(uid,'developer') THEN
    SELECT credits INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
    IF bal < prod.price_credits THEN RAISE EXCEPTION 'insufficient credits'; END IF;
    UPDATE public.profiles SET credits = credits - prod.price_credits WHERE id = uid;
    INSERT INTO public.credit_transactions(user_id, amount, reason, metadata) VALUES (uid, -prod.price_credits, 'marketplace_purchase', jsonb_build_object('product_id',_product_id));
  END IF;

  INSERT INTO public.marketplace_orders(buyer_id, seller_id, product_id, amount_credits, commission_credits, seller_credits)
  VALUES (uid, prod.seller_id, _product_id, prod.price_credits, commission, seller_cut);

  INSERT INTO public.seller_balances(user_id, available_credits, lifetime_credits)
  VALUES (prod.seller_id, seller_cut, seller_cut)
  ON CONFLICT (user_id) DO UPDATE SET available_credits = seller_balances.available_credits + seller_cut, lifetime_credits = seller_balances.lifetime_credits + seller_cut, updated_at = now();

  UPDATE public.marketplace_products SET sales_count = sales_count + 1 WHERE id = _product_id;
  RETURN jsonb_build_object('ok', true, 'file_url', prod.file_url);
END $$;

CREATE OR REPLACE FUNCTION public.mp_request_payout(_amount INTEGER, _method TEXT, _details JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  avail INTEGER;
  pid UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  SELECT available_credits INTO avail FROM public.seller_balances WHERE user_id = uid FOR UPDATE;
  IF COALESCE(avail,0) < _amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  UPDATE public.seller_balances SET available_credits = available_credits - _amount, updated_at = now() WHERE user_id = uid;
  INSERT INTO public.seller_payouts(user_id, amount_credits, method, details)
  VALUES (uid, _amount, _method, _details) RETURNING id INTO pid;
  RETURN pid;
END $$;

-- Update review triggers to keep product rating aggregates fresh
CREATE OR REPLACE FUNCTION public.tg_mp_review_agg()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE pid UUID;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.marketplace_products p SET
    rating_count = (SELECT COUNT(*) FROM public.marketplace_reviews WHERE product_id = pid),
    rating_avg = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.marketplace_reviews WHERE product_id = pid),0)
  WHERE p.id = pid;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER mp_reviews_agg AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_reviews
FOR EACH ROW EXECUTE FUNCTION public.tg_mp_review_agg();

-- ============ SETTINGS SEED ============
INSERT INTO public.app_settings(key, value, description) VALUES
  ('marketplace.commission_pct', '10'::jsonb, 'نسبة عمولة المتجر %'),
  ('ads.daily_cap_per_section', '10'::jsonb, 'حد الإعلانات اليومية لكل قسم'),
  ('ads.threshold_multi', '100'::jsonb, 'أعلى من هذه التكلفة يشاهد 3 إعلانات'),
  ('features.marketplace', 'true'::jsonb, 'تفعيل المتجر'),
  ('features.agents', 'false'::jsonb, 'تفعيل وكلاء AI'),
  ('features.workspace', 'false'::jsonb, 'تفعيل مساحة العمل'),
  ('features.fitness', 'false'::jsonb, 'تفعيل قسم اللياقة'),
  ('features.languages', 'false'::jsonb, 'تفعيل تعلم اللغات'),
  ('lang.errors_before_ad', '10'::jsonb, 'عدد الأخطاء قبل إعلان اللغات'),
  ('cost.tts_short', '10'::jsonb, 'TTS قصير'),
  ('cost.tts_medium', '20'::jsonb, 'TTS متوسط'),
  ('cost.tts_long', '40'::jsonb, 'TTS طويل'),
  ('cost.tts_pro', '80'::jsonb, 'TTS احترافي'),
  ('cost.voice_clone', '150'::jsonb, 'استنساخ صوت'),
  ('cost.dub_30s', '25'::jsonb, 'دبلجة 30ث'),
  ('cost.dub_1m', '50'::jsonb, 'دبلجة دقيقة'),
  ('cost.dub_3m', '120'::jsonb, 'دبلجة 3د'),
  ('cost.dub_5m', '180'::jsonb, 'دبلجة 5د'),
  ('cost.dub_10m', '300'::jsonb, 'دبلجة 10د'),
  ('cost.image_standard', '40'::jsonb, 'صورة Standard'),
  ('cost.image_pro', '60'::jsonb, 'صورة Pro'),
  ('cost.image_ultra', '100'::jsonb, 'صورة Ultra'),
  ('cost.image_master', '200'::jsonb, 'صورة Master'),
  ('cost.image_premium', '300'::jsonb, 'صورة Premium'),
  ('cost.video_6s', '25'::jsonb, 'فيديو 6ث'),
  ('cost.video_30s', '50'::jsonb, 'فيديو 30ث'),
  ('cost.video_1m', '100'::jsonb, 'فيديو دقيقة'),
  ('cost.video_3m', '300'::jsonb, 'فيديو 3د'),
  ('cost.video_5m', '500'::jsonb, 'فيديو 5د'),
  ('cost.bg_remove', '10'::jsonb, 'إزالة الخلفية'),
  ('cost.enhance', '15'::jsonb, 'تحسين الجودة'),
  ('cost.upscale', '20'::jsonb, 'تكبير الصور'),
  ('cost.logo', '30'::jsonb, 'إنشاء شعار'),
  ('cost.thumbnail', '20'::jsonb, 'Thumbnail'),
  ('cost.banner', '30'::jsonb, 'Banner'),
  ('cost.shorts', '40'::jsonb, 'تحويل فيديو إلى Shorts'),
  ('cost.pdf_summary', '10'::jsonb, 'تلخيص PDF'),
  ('cost.image_analysis', '15'::jsonb, 'تحليل صورة'),
  ('cost.ocr', '10'::jsonb, 'OCR')
ON CONFLICT (key) DO NOTHING;
