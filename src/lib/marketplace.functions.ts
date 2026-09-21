import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const MP_CATEGORIES = [
  "apps_android","apps_ios","websites","games","source_projects","templates",
  "prompts","ai_images","ai_videos","ai_audio","logos","thumbnails","banners",
  "characters","bots","apis","plugins","designs","ebooks","courses","other",
] as const;
export type MpCategory = (typeof MP_CATEGORIES)[number];

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((i: { search?: string; category?: string; limit?: number } | undefined) => i ?? {})
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supa = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    let q = supa.from("marketplace_products")
      .select("id,title,description,category,product_type,price_credits,cover_url,rating_avg,rating_count,sales_count,seller_id,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 60, 100));
    if (data.category) q = q.eq("category", data.category);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supa = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const [{ data: prod, error: e1 }, { data: reviews, error: e2 }] = await Promise.all([
      supa.from("marketplace_products").select("*").eq("id", data.id).maybeSingle(),
      supa.from("marketplace_reviews").select("id,rating,comment,created_at,user_id").eq("product_id", data.id).order("created_at", { ascending: false }).limit(30),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    if (!prod) throw new Error("not found");
    return { product: prod, reviews: reviews ?? [] };
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    title: string; description: string; category: string; product_type: string;
    price_credits: number; cover_url?: string; file_url?: string; demo_url?: string;
    keywords?: string[];
  }) => i)
  .handler(async ({ data, context }) => {
    if (!data.title.trim() || data.title.length > 120) throw new Error("invalid title");
    if (data.price_credits < 0 || data.price_credits > 1000000) throw new Error("invalid price");
    const { data: row, error } = await context.supabase
      .from("marketplace_products")
      .insert({
        seller_id: context.userId,
        title: data.title.trim().slice(0, 120),
        description: (data.description ?? "").slice(0, 4000),
        category: data.category,
        product_type: data.product_type,
        price_credits: Math.floor(data.price_credits),
        cover_url: data.cover_url || null,
        file_url: data.file_url || null,
        demo_url: data.demo_url || null,
        keywords: data.keywords ?? [],
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("marketplace_products")
      .select("id,title,category,price_credits,cover_url,status,sales_count,rating_avg,rating_count,created_at")
      .eq("seller_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteMyProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("marketplace_products")
      .delete()
      .eq("id", data.id)
      .eq("seller_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const purchaseProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc("mp_purchase", { _product_id: data.id });
    if (error) throw new Error(error.message);
    return res as { ok: boolean; file_url?: string; already?: boolean };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("marketplace_orders")
      .select("id,amount_credits,status,created_at,product_id,marketplace_products(title,cover_url,file_url)")
      .eq("buyer_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { product_id: string; rating: number; comment: string }) => i)
  .handler(async ({ data, context }) => {
    const rating = Math.max(1, Math.min(5, Math.floor(data.rating)));
    const { error } = await context.supabase.from("marketplace_reviews").upsert({
      product_id: data.product_id,
      user_id: context.userId,
      rating,
      comment: (data.comment ?? "").slice(0, 1000),
    }, { onConflict: "product_id,user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSellerDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [bal, orders, payouts] = await Promise.all([
      context.supabase.from("seller_balances").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("marketplace_orders").select("id,amount_credits,seller_credits,commission_credits,status,created_at,product_id,marketplace_products(title)").eq("seller_id", context.userId).order("created_at", { ascending: false }).limit(50),
      context.supabase.from("seller_payouts").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(30),
    ]);
    return {
      balance: bal.data ?? { available_credits: 0, lifetime_credits: 0 },
      orders: orders.data ?? [],
      payouts: payouts.data ?? [],
    };
  });

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { amount: number; method: string; details: Record<string, string> }) => i)
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("mp_request_payout", {
      _amount: Math.floor(data.amount),
      _method: data.method,
      _details: data.details,
    });
    if (error) throw new Error(error.message);
    return { id };
  });

export const recordAdWatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { section: string; count?: number }) => i)
  .handler(async ({ data, context }) => {
    const { data: n, error } = await context.supabase.rpc("record_ad_watch", {
      _section: data.section, _count: data.count ?? 1,
    });
    if (error) throw new Error(error.message);
    return { count: n as number };
  });

export const spendOrWatchAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { cost: number; section: string; reason: string }) => i)
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc("spend_or_watch_ad", {
      _cost: Math.floor(data.cost), _section: data.section, _reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return res as {
      ok: boolean; mode?: string; balance?: number;
      reason?: string; ads_needed?: number; ads_today?: number; cap?: number; cost?: number;
    };
  });