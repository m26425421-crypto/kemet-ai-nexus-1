import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,avatar_url,locale,theme,plan,credits,last_daily_bonus_at,created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    // Fallback: if the trigger did not create a profile yet (rare timing), create it now.
    if (!data) {
      const { data: created, error: e2 } = await supabase
        .from("profiles")
        .insert({ id: userId, credits: 150 })
        .select("id,email,full_name,avatar_url,locale,theme,plan,credits,last_daily_bonus_at,created_at")
        .single();
      if (e2) throw new Error(e2.message);
      return { ...created, roles: [] as string[], isDeveloper: false };
    }
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (roleRows ?? []).map((r) => r.role as string);
    return { ...data, roles, isDeveloper: roles.includes("developer") };
  });

export const claimDailyBonus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("claim_daily_bonus");
    if (error) throw new Error(error.message);
    return { newBalance: data as number };
  });

export const listCreditTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("id,amount,reason,metadata,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { full_name?: string; locale?: string; theme?: string }) => input)
  .handler(async ({ data, context }) => {
    const patch: { full_name?: string; locale?: string; theme?: string } = {};
    if (typeof data.full_name === "string") patch.full_name = data.full_name.trim().slice(0, 100);
    if (data.locale === "ar" || data.locale === "en") patch.locale = data.locale;
    if (data.theme === "dark" || data.theme === "light") patch.theme = data.theme;
    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("generated_images")
      .select("id,prompt,image_data,quality,cost,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteMyImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("generated_images")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });