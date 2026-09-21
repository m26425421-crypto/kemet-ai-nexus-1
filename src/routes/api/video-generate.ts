import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  ALLOWED_DURATIONS,
  DURATION_COSTS,
  planSegments,
  submitFalSegment,
} from "@/lib/fal.server";
import { getSettingNumber } from "@/lib/settings-shared";

function serverSupabase(token: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const Route = createFileRoute("/api/video-generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          if (!auth.startsWith("Bearer ")) return json({ error: "UNAUTHORIZED" }, 401);
          const token = auth.slice(7);
          const supabase = serverSupabase(token);
          const { data: userData, error: userErr } = await supabase.auth.getUser(token);
          if (userErr || !userData?.user) return json({ error: "UNAUTHORIZED" }, 401);
          const userId = userData.user.id;

          const body = (await request.json()) as {
            mode?: "t2v" | "i2v";
            prompt?: string;
            imageUrl?: string;
            duration?: number;
            aspect?: string;
          };
          const mode = body.mode === "i2v" ? "i2v" : "t2v";
          const prompt = (body.prompt ?? "").trim();
          const duration = Number(body.duration);
          const aspect =
            body.aspect === "portrait" || body.aspect === "square" ? body.aspect : "landscape";

          if (prompt.length < 3) return json({ error: "PROMPT_TOO_SHORT" }, 400);
          if (prompt.length > 2000) return json({ error: "PROMPT_TOO_LONG" }, 400);
          if (!ALLOWED_DURATIONS.includes(duration as (typeof ALLOWED_DURATIONS)[number])) {
            return json({ error: "INVALID_DURATION" }, 400);
          }
          if (mode === "i2v") {
            if (!body.imageUrl || !/^https?:\/\//.test(body.imageUrl)) {
              return json({ error: "IMAGE_URL_REQUIRED" }, 400);
            }
          }

          const cost = await getSettingNumber(
            supabase,
            `cost.video_${duration}s`,
            DURATION_COSTS[duration],
          );
          if (!process.env.FAL_API_KEY) return json({ error: "FAL_NOT_CONFIGURED" }, 503);

          const { data: modelSetting } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", mode === "t2v" ? "video.model.t2v" : "video.model.i2v")
            .maybeSingle();
          const model =
            (modelSetting?.value as string | undefined) ??
            (mode === "t2v"
              ? "fal-ai/kling-video/v2.1/standard/text-to-video"
              : "fal-ai/kling-video/v2.1/standard/image-to-video");

          const { segmentSeconds, totalSegments } = planSegments(duration);

          // Deduct credits (atomic RPC). Developer bypass handled inside RPC.
          const { data: spendResult, error: spendErr } = await supabase.rpc("spend_credits", {
            _amount: cost,
            _reason: `video_${duration}s`,
            _metadata: { mode, duration, aspect },
          });
          if (spendErr) return json({ error: spendErr.message }, 500);
          if (spendResult === -1) return json({ error: "INSUFFICIENT_CREDITS", required: cost }, 402);

          // Insert job row FIRST so we always have a handle for refund.
          const { data: inserted, error: insErr } = await supabase
            .from("video_jobs")
            .insert({
              user_id: userId,
              mode,
              prompt,
              image_url: mode === "i2v" ? body.imageUrl! : null,
              duration_seconds: duration,
              aspect,
              cost,
              total_segments: totalSegments,
              segment_seconds: segmentSeconds,
              status: "processing",
            })
            .select("id")
            .single();
          if (insErr || !inserted) {
            await refundVia(supabase, userId, cost, `refund_video_${duration}s`);
            return json({ error: "DB_INSERT_FAILED" }, 500);
          }
          const jobId = inserted.id;

          // Submit FIRST segment to Fal.
          try {
            const sub = await submitFalSegment({
              model,
              mode,
              prompt,
              imageUrl: body.imageUrl,
              segmentSeconds,
              aspect,
            });
            await supabase
              .from("video_jobs")
              .update({ fal_request_ids: [sub.request_id] })
              .eq("id", jobId);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "FAL_SUBMIT_FAILED";
            await refundVia(supabase, userId, cost, `refund_video_${duration}s`);
            await supabase
              .from("video_jobs")
              .update({ status: "refunded", error: msg })
              .eq("id", jobId);
            const friendly = mapFalError(msg);
            return json({ error: friendly.code, message: friendly.message, detail: msg }, friendly.status);
          }

          return json({
            ok: true,
            jobId,
            totalSegments,
            segmentSeconds,
            cost,
            newBalance: spendResult,
          });
        } catch (e) {
          console.error("video-generate error", e);
          return json({ error: "SERVER_ERROR", message: e instanceof Error ? e.message : "error" }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mapFalError(raw: string): { code: string; message: string; status: number } {
  const s = raw.toLowerCase();
  if (s.includes("exhausted balance") || s.includes("user is locked")) {
    return {
      code: "FAL_BALANCE_EXHAUSTED",
      message:
        "حساب مزوّد الفيديو (Fal.ai) مقفول بسبب نفاد الرصيد. اشحن الرصيد من fal.ai/dashboard/billing ثم أعد المحاولة.",
      status: 400,
    };
  }
  if (s.includes("fal_invalid_key") || s.includes("401") || s.includes("403") && s.includes("forbidden")) {
    return {
      code: "FAL_INVALID_KEY",
      message: "مفتاح Fal.ai غير صالح أو منتهي الصلاحية. حدّث المفتاح من إعدادات المشروع.",
      status: 400,
    };
  }
  if (s.includes("fal_rate_limit") || s.includes("429")) {
    return {
      code: "FAL_RATE_LIMIT",
      message: "تم تجاوز حد الطلبات على Fal.ai. انتظر قليلاً ثم أعد المحاولة.",
      status: 429,
    };
  }
  if (s.includes("fal_not_configured")) {
    return {
      code: "FAL_NOT_CONFIGURED",
      message: "لم يتم ضبط مفتاح FAL_API_KEY في الخادم.",
      status: 503,
    };
  }
  return {
    code: "FAL_SUBMIT_FAILED",
    message: "تعذر بدء توليد الفيديو لدى المزوّد. تم إرجاع الكريدت. حاول مجدداً.",
    status: 400,
  };
}

async function refundVia(
  supabase: ReturnType<typeof serverSupabase>,
  userId: string,
  amount: number,
  reason: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.rpc("refund_credits", {
    _user_id: userId,
    _amount: amount,
    _reason: reason,
  });
  void supabase; // supabase kept for potential future auditing hooks
}