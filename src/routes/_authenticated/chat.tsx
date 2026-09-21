import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function ChatPage() {
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || status === "streaming") return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantId = crypto.randomUUID();
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setStatus("streaming");
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const uiMessages = nextMessages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: uiMessages }),
        signal: ac.signal,
      });
      if (!res.ok) {
        let msg = t("error_generic");
        try {
          const j = (await res.json()) as { error?: string };
          if (res.status === 503 && j.error === "AI_NOT_CONFIGURED") {
            msg =
              locale === "ar"
                ? "خدمة الذكاء الاصطناعي غير مفعّلة بعد. البنية جاهزة، سيتم التفعيل قريباً."
                : "AI service is not activated yet. Infrastructure is ready.";
          } else if (res.status === 429) {
            msg = locale === "ar" ? "تجاوزت حد الطلبات، حاول لاحقاً." : "Rate limited.";
          } else if (res.status === 402) {
            msg = locale === "ar" ? "نفذ الرصيد لدى المزود." : "AI credits exhausted.";
          } else if (j.error) {
            msg = j.error;
          }
        } catch {
          /* noop */
        }
        setMessages((m) => m.filter((x) => x.id !== assistantId));
        toast.error(msg);
        setStatus("idle");
        return;
      }

      // Parse AI SDK UI-message SSE stream. We look for text-delta events.
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
              setMessages((m) =>
                m.map((x) => (x.id === assistantId ? { ...x, content: acc } : x)),
              );
            }
          } catch {
            /* ignore */
          }
        }
      }
      setStatus("idle");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setStatus("idle");
        return;
      }
      setMessages((m) => m.filter((x) => x.id !== assistantId));
      toast.error(e instanceof Error ? e.message : t("error_generic"));
      setStatus("idle");
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-56px-64px)] max-w-3xl flex-col px-3 py-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">{t("chat")}</h1>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1.5">
            <Trash2 className="size-4" />
            {t("clear")}
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border/60 bg-card/40 p-4"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} msg={m} isStreaming={status === "streaming"} />)
        )}
      </div>

      <div className="mt-3 flex items-end gap-2 rounded-2xl border border-border/60 bg-card p-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t("chat_placeholder")}
          rows={1}
          className="min-h-[42px] resize-none border-0 bg-transparent focus-visible:ring-0"
        />
        {status === "streaming" ? (
          <Button size="icon" variant="destructive" onClick={stop}>
            <Loader2 className="size-4 animate-spin" />
          </Button>
        ) : (
          <Button size="icon" onClick={send} disabled={!input.trim()}>
            <Send className="size-4" />
          </Button>
        )}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {locale === "ar" ? "المحادثة النصية مجانية بدون كريدت" : "Text chat is free — no credits"}
      </p>
    </div>
  );
}

function EmptyState() {
  const { locale } = useI18n();
  const suggestions = locale === "ar"
    ? ["اكتب لي مقالاً عن التوكل", "لخّص لي كتاب صغير", "اقترح فكرة فيديو يوتيوب", "ترجم النص التالي..."]
    : ["Write an article about trust in God", "Summarize a short book", "Suggest a YouTube video idea", "Translate the following text..."];
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Logo size={64} className="mb-4" />
      <h2 className="mb-1 text-lg font-bold">KEMET AI</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        {locale === "ar" ? "اسأل عن أي شيء" : "Ask anything"}
      </p>
      <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <div
            key={s}
            className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-start text-xs text-muted-foreground"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg, isStreaming }: { msg: Msg; isStreaming: boolean }) {
  const isUser = msg.role === "user";
  const empty = !msg.content && !isUser;
  function copy() {
    navigator.clipboard.writeText(msg.content);
    toast.success("Copied");
  }
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "group relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        {empty && isStreaming ? (
          <span className="inline-flex gap-1">
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
          </span>
        ) : (
          <div className="whitespace-pre-wrap">{msg.content}</div>
        )}
        {!isUser && msg.content && (
          <button
            onClick={copy}
            className="absolute -bottom-6 end-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Copy className="size-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}