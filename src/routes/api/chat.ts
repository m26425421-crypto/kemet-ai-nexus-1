import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayProvider,
  KEMET_SYSTEM_PROMPT_AR,
} from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: unknown; system?: string };
          if (!Array.isArray(body.messages)) {
            return new Response("Messages required", { status: 400 });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return new Response(
              JSON.stringify({ error: "AI_NOT_CONFIGURED" }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          }
          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");
          const modelMessages = await convertToModelMessages(body.messages as UIMessage[]);
          const system =
            typeof body.system === "string" && body.system.trim().length > 0
              ? `${KEMET_SYSTEM_PROMPT_AR}\n\n---\n\n${body.system}`
              : KEMET_SYSTEM_PROMPT_AR;
          const result = streamText({
            model,
            system,
            messages: modelMessages,
          });
          return result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
          });
        } catch (e) {
          console.error("chat error", e);
          const msg = e instanceof Error ? e.message : "unknown";
          const status = /429|rate/i.test(msg) ? 429 : /402|credit/i.test(msg) ? 402 : 500;
          return new Response(JSON.stringify({ error: msg }), {
            status,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});