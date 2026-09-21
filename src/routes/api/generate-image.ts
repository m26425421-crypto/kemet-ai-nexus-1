import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { IMAGE_QUALITIES, IMAGE_ASPECTS, type ImageQualityId, type ImageAspectId } from "@/lib/features";
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

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          if (!auth.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401 });
          }
          const token = auth.slice(7);
          const supabase = serverSupabase(token);
          const { data: userData, error: userErr } = await supabase.auth.getUser(token);
          if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });
          const userId = userData.user.id;

          const body = (await request.json()) as {
            prompt?: string;
            quality?: ImageQualityId;
            aspect?: ImageAspectId;
          };
          const prompt = (body.prompt ?? "").trim();
          if (!prompt || prompt.length < 3) return new Response("Prompt required", { status: 400 });
          if (prompt.length > 1200) return new Response("Prompt too long", { status: 400 });

          const spec = IMAGE_QUALITIES.find((q) => q.id === body.quality) ?? IMAGE_QUALITIES[0];
          const aspect = IMAGE_ASPECTS.find((a) => a.id === body.aspect) ?? IMAGE_ASPECTS[0];
          // Price comes from the admin dashboard (app_settings), falling back to the code default.
          const cost = await getSettingNumber(supabase, `cost.image_${spec.id}`, spec.cost);

          // Deduct credits atomically via RPC.
          const { data: spendResult, error: spendErr } = await supabase.rpc("spend_credits", {
            _amount: cost,
            _reason: `image_${spec.id}`,
            _metadata: { quality: spec.id },
          });
          if (spendErr) {
            return new Response(JSON.stringify({ error: spendErr.message }), { status: 500 });
          }
          if (spendResult === -1) {
            return new Response(JSON.stringify({ error: "INSUFFICIENT_CREDITS" }), {
              status: 402,
              headers: { "Content-Type": "application/json" },
            });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            // Refund
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.rpc("refund_credits", {
              _user_id: userId,
              _amount: cost,
              _reason: `refund_${spec.id}`,
            });
            return new Response(JSON.stringify({ error: "AI_NOT_CONFIGURED" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          }

          const upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/images/generations",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: spec.model,
                prompt,
                quality: spec.quality,
                size: aspect.size,
                n: 1,
              }),
            },
          );

          if (!upstream.ok) {
            // Refund on failure
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.rpc("refund_credits", {
              _user_id: userId,
              _amount: cost,
              _reason: `refund_${spec.id}`,
            });
            const text = await upstream.text().catch(() => "");
            const status = upstream.status === 429 ? 429 : upstream.status === 402 ? 402 : 500;
            return new Response(JSON.stringify({ error: text || "IMAGE_GEN_FAILED" }), {
              status,
              headers: { "Content-Type": "application/json" },
            });
          }

          const json = (await upstream.json()) as {
            data?: Array<{ b64_json?: string; url?: string }>;
          };
          const first = json.data?.[0];
          let dataUrl: string | null = null;
          if (first?.b64_json) {
            dataUrl = `data:image/png;base64,${first.b64_json}`;
          } else if (first?.url) {
            dataUrl = first.url;
          }
          if (!dataUrl) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.rpc("refund_credits", {
              _user_id: userId,
              _amount: cost,
              _reason: `refund_${spec.id}`,
            });
            return new Response(JSON.stringify({ error: "NO_IMAGE_RETURNED" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { data: inserted } = await supabase
            .from("generated_images")
            .insert({
              user_id: userId,
              prompt,
              image_data: dataUrl,
              quality: spec.id,
              cost,
            })
            .select("id,created_at")
            .single();

          return Response.json({
            id: inserted?.id,
            image: dataUrl,
            newBalance: spendResult,
            cost,
            quality: spec.id,
            prompt,
          });
        } catch (e) {
          console.error("image gen error", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});