import { useRef, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Square, Download } from "lucide-react";
import { streamTask } from "@/lib/stream-task";
import { useI18n } from "@/lib/i18n";

interface TaskRunnerProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  inputLabel: string;
  inputPlaceholder: string;
  actionLabel: string;
  system: string;
  buildUserMessage: (input: string) => string;
  controls?: ReactNode;
  maxLength?: number;
  minLength?: number;
  outputMono?: boolean;
  downloadFilename?: string;
}

export function TaskRunner(props: TaskRunnerProps) {
  const { locale, t } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const minLength = props.minLength ?? 2;

  async function run() {
    const trimmed = input.trim();
    if (trimmed.length < minLength) {
      toast.error(locale === "ar" ? "الإدخال قصير جداً" : "Input too short");
      return;
    }
    setBusy(true);
    setOutput("");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamTask({
        system: props.system,
        userText: props.buildUserMessage(trimmed),
        signal: ac.signal,
        onDelta: (full) => setOutput(full),
      });
    } catch (e) {
      const err = e instanceof Error ? e.message : "error";
      if (err === "AI_NOT_CONFIGURED") {
        toast.error(locale === "ar" ? "خدمة الذكاء الاصطناعي غير مفعّلة" : "AI service not configured");
      } else if (err === "RATE_LIMIT") {
        toast.error(locale === "ar" ? "تجاوزت حد الطلبات، حاول لاحقاً" : "Rate limited");
      } else if (err === "PROVIDER_CREDIT_EXHAUSTED") {
        toast.error(locale === "ar" ? "نفذ رصيد المزود" : "Provider credits exhausted");
      } else if ((e as Error).name !== "AbortError") {
        toast.error(err);
      }
    } finally {
      setBusy(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setBusy(false);
  }

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success(t("copied"));
  }

  function download() {
    if (!output) return;
    const filename = props.downloadFilename ?? "kemet-output.txt";
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
          {props.icon}
        </div>
        <div>
          <h1 className="text-xl font-bold">{props.title}</h1>
          {props.subtitle && (
            <p className="text-xs text-muted-foreground">{props.subtitle}</p>
          )}
        </div>
      </div>

      <Card className="mb-4 space-y-3 p-4">
        {props.controls}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            {props.inputLabel}
          </label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={props.inputPlaceholder}
            rows={5}
            maxLength={props.maxLength ?? 8000}
            className="resize-none"
          />
        </div>
        <div className="flex gap-2">
          {busy ? (
            <Button variant="destructive" onClick={stop} className="h-11 flex-1 gap-2">
              <Square className="size-4" />
              {locale === "ar" ? "إيقاف" : "Stop"}
            </Button>
          ) : (
            <Button
              onClick={run}
              disabled={!input.trim()}
              className="h-11 flex-1 gap-2 font-semibold"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {props.actionLabel}
            </Button>
          )}
        </div>
      </Card>

      {(output || busy) && (
        <Card className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "النتيجة" : "Result"}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={copy}
                disabled={!output}
                className="h-8 gap-1.5"
              >
                <Copy className="size-3.5" />
                {t("copy")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={download}
                disabled={!output}
                className="h-8 gap-1.5"
              >
                <Download className="size-3.5" />
                {t("download")}
              </Button>
            </div>
          </div>
          <div
            className={
              "min-h-[80px] whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed " +
              (props.outputMono ? "font-mono text-xs" : "")
            }
          >
            {output}
            {busy && !output && (
              <span className="inline-flex gap-1">
                <span className="size-1.5 animate-pulse rounded-full bg-current" />
                <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
                <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}