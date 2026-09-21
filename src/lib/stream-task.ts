// Client helper to stream a text task from /api/chat.
// Reuses the existing SSE parser used by the chat page.

export interface StreamTaskOptions {
  system?: string;
  userText: string;
  signal?: AbortSignal;
  onDelta: (fullText: string) => void;
}

export async function streamTask(opts: StreamTaskOptions): Promise<string> {
  const uiMessages = [
    {
      id: crypto.randomUUID(),
      role: "user" as const,
      parts: [{ type: "text", text: opts.userText }],
    },
  ];
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: uiMessages, system: opts.system }),
    signal: opts.signal,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (res.status === 503 && j.error === "AI_NOT_CONFIGURED") msg = "AI_NOT_CONFIGURED";
      else if (res.status === 429) msg = "RATE_LIMIT";
      else if (res.status === 402) msg = "PROVIDER_CREDIT_EXHAUSTED";
      else if (j.error) msg = j.error;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("no stream");
  const decoder = new TextDecoder();
  let buffer = "";
  let acc = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as { type?: string; delta?: string };
        if (evt.type === "text-delta" && typeof evt.delta === "string") {
          acc += evt.delta;
          opts.onDelta(acc);
        }
      } catch {
        /* ignore */
      }
    }
  }
  return acc;
}