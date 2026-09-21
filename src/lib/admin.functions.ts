import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.rpc("admin_stats");
    if (error) throw new Error(error.message);
    return data as Record<string, Json>;
  });

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { search?: string; limit?: number; offset?: number }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase.rpc("admin_list_users", {
      _search: data.search ?? "",
      _limit: data.limit ?? 100,
      _offset: data.offset ?? 0,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{
      id: string;
      email: string;
      full_name: string | null;
      credits: number;
      plan: string;
      banned: boolean;
      created_at: string;
      roles: string[];
    }>;
  });

export const adminSetCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { user_id: string; credits: number }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_set_credits", {
      _user_id: data.user_id,
      _credits: Math.max(0, Math.floor(data.credits)),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { user_id: string; plan: "free" | "plus" | "pro" | "ultra" }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_set_plan", {
      _user_id: data.user_id,
      _plan: data.plan,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetBanned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { user_id: string; banned: boolean }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_set_banned", {
      _user_id: data.user_id,
      _banned: data.banned,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("app_settings")
      .select("key,value,description,updated_at")
      .order("key");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      key: string;
      value: Json;
      description: string | null;
      updated_at: string;
    }>;
  });

export const adminSetSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { key: string; value: Json }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_set_setting", {
      _key: data.key,
      _value: data.value as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminMpPendingProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.rpc("admin_mp_pending_products");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{ id: string; seller_id: string; title: string; category: string; price_credits: number; cover_url: string | null; description: string; created_at: string }>;
  });

export const adminMpSetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: "approved" | "rejected" | "archived" | "pending" }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_mp_set_status", { _id: data.id, _status: data.status });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminMpPendingPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.rpc("admin_mp_pending_payouts");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{ id: string; user_id: string; amount_credits: number; method: string; details: Json; status: string; created_at: string }>;
  });

export const adminMpSetPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: "approved" | "rejected" | "paid"; note?: string }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_mp_set_payout", { _id: data.id, _status: data.status, _note: data.note });
    if (error) throw new Error(error.message);
    return { ok: true };
  });