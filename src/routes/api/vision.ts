import { createFileRoute } from "@tanstack/react-router";
import { KEMET_SYSTEM_PROMPT_AR } from "@/lib/ai-gateway.server";
import { TASK_PROMPTS } from "@/lib/task-prompts";

export const Route = createFileRoute("/api/vision")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            image?: string;
            question?: string;
          };
          if (!body.image || !body.image.startsWith("data:image/")) {
            return new Response(JSON.stringify({ error: "IMAGE_REQUIRED" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return new Response(JSON.stringify({ error: "AI_NOT_CONFIGURED" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          }
          const question =
            (body.question ?? "").trim() ||
            "حلّل هذه الصورة بالتفصيل حسب التعليمات.";

          const upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  { role: "system", content: `${KEMET_SYSTEM_PROMPT_AR}\n\n---\n\n${TASK_PROMPTS.vision}` },
                  {
                    role: "user",
                    content: [
                      { type: "text", text: question },
                      { type: "image_url", image_url: { url: body.image } },
                    ],
                  },
                ],
              }),
            },
          );
          if (!upstream.ok) {
            const text = await upstream.text().catch(() => "");
            const status = upstream.status === 429 ? 429 : upstream.status === 402 ? 402 : 500;
            return new Response(
              JSON.stringify({ error: text || "VISION_FAILED" }),
              { status, headers: { "Content-Type": "application/json" } },
            );
          }
          const json = (await upstream.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const text = json.choices?.[0]?.message?.content ?? "";
          return Response.json({ text });
        } catch (e) {
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});