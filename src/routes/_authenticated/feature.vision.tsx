import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ScanEye, Upload, Loader2, Copy, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/feature/vision")({
  component: VisionFeature,
});

function VisionFeature() {
  const { locale, t } = useI18n();
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickFile() {
    fileInputRef.current?.click();
  }

  async function onFile(f: File) {
    if (!f.type.startsWith("image/")) {
      return toast.error(locale === "ar" ? "اختر صورة فقط" : "Please pick an image");
    }
    if (f.size > 6 * 1024 * 1024) {
      return toast.error(locale === "ar" ? "الحجم أقصى 6 ميجا" : "Max 6MB");
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function analyze() {
    if (!imageDataUrl) return toast.error(locale === "ar" ? "ارفع صورة أولاً" : "Upload an image first");
    setBusy(true);
    setOutput("");
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl, question: question.trim() }),
      });
      const j = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(j.error ?? "error");
      setOutput(j.text ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(output);
    toast.success(t("copied"));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
          <ScanEye className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{locale === "ar" ? "تحليل الصور" : "Image Analysis"}</h1>
          <p className="text-xs text-muted-foreground">
            {locale === "ar" ? "افهم أي صورة بذكاء (OCR، وصف، تحليل)" : "Understand any image (OCR, description, analysis)"}
          </p>
        </div>
      </div>

      <Card className="mb-4 space-y-3 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        {imageDataUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img src={imageDataUrl} alt="upload" className="max-h-72 w-full object-contain bg-secondary/30" />
            <button
              onClick={pickFile}
              className="absolute top-2 end-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur"
            >
              {locale === "ar" ? "تغيير" : "Change"}
            </button>
          </div>
        ) : (
          <button
            onClick={pickFile}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50"
          >
            <Upload className="size-6" />
            <span className="text-sm">{locale === "ar" ? "اضغط لرفع صورة" : "Click to upload"}</span>
            <span className="text-[10px]">JPG / PNG / WEBP · حتى 6MB</span>
          </button>
        )}
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={locale === "ar" ? "اختياري: اطرح سؤالاً محدداً..." : "Optional: ask a specific question..."}
          rows={2}
          className="resize-none"
        />
        <Button
          onClick={analyze}
          disabled={busy || !imageDataUrl}
          className="h-11 w-full gap-2 font-semibold"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {locale === "ar" ? "حلّل الصورة" : "Analyze"}
        </Button>
      </Card>

      {(output || busy) && (
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "التحليل" : "Analysis"}
            </span>
            {output && (
              <Button size="sm" variant="ghost" onClick={copy} className="h-8 gap-1.5">
                <Copy className="size-3.5" />
                {t("copy")}
              </Button>
            )}
          </div>
          <div className="whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed">
            {output || (
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