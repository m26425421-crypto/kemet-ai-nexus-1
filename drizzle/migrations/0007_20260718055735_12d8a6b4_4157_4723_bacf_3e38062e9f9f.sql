
CREATE OR REPLACE FUNCTION public.admin_mp_pending_products()
RETURNS TABLE(id UUID, seller_id UUID, title TEXT, category TEXT, price_credits INTEGER, cover_url TEXT, description TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT p.id, p.seller_id, p.title, p.category, p.price_credits, p.cover_url, p.description, p.created_at
    FROM public.marketplace_products p WHERE p.status = 'pending' ORDER BY p.created_at DESC LIMIT 200;
END $$;

CREATE OR REPLACE FUNCTION public.admin_mp_set_status(_id UUID, _status TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('approved','rejected','archived','pending') THEN RAISE EXCEPTION 'bad status'; END IF;
  UPDATE public.marketplace_products SET status = _status, updated_at = now() WHERE id = _id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_mp_pending_payouts()
RETURNS TABLE(id UUID, user_id UUID, amount_credits INTEGER, method TEXT, details JSONB, status TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT p.id, p.user_id, p.amount_credits, p.method, p.details, p.status, p.created_at
    FROM public.seller_payouts p WHERE p.status IN ('pending','approved') ORDER BY p.created_at DESC LIMIT 200;
END $$;

CREATE OR REPLACE FUNCTION public.admin_mp_set_payout(_id UUID, _status TEXT, _note TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('approved','rejected','paid') THEN RAISE EXCEPTION 'bad status'; END IF;
  SELECT * INTO pr FROM public.seller_payouts WHERE id = _id FOR UPDATE;
  IF pr IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF _status = 'rejected' AND pr.status <> 'rejected' THEN
    UPDATE public.seller_balances SET available_credits = available_credits + pr.amount_credits, updated_at = now() WHERE user_id = pr.user_id;
  END IF;
  UPDATE public.seller_payouts SET status = _status, admin_note = COALESCE(_note, admin_note), updated_at = now() WHERE id = _id;
END $$;
