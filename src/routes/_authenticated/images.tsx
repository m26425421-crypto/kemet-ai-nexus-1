import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { IMAGE_QUALITIES, IMAGE_ASPECTS, type ImageQualityId, type ImageAspectId } from "@/lib/features";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyImage, listMyImages } from "@/lib/credits.functions";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { ImageViewer, type ViewerImage } from "@/components/image-viewer";

export const Route = createFileRoute("/_authenticated/images")({
  component: ImagesPage,
});

function ImagesPage() {
  const { t, locale } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [quality, setQuality] = useState<ImageQualityId>("fast");
  const [aspect, setAspect] = useState<ImageAspectId>("square");
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState<ViewerImage | null>(null);
  const qc = useQueryClient();
  const settings = useSettings();
  const costOf = (id: ImageQualityId) => {
    const base = IMAGE_QUALITIES.find((q) => q.id === id)!.cost;
    return settings.num(`cost.image_${id}`, base);
  };
  const listFn = useServerFn(listMyImages);
  const delFn = useServerFn(deleteMyImage);

  const { data: gallery = [] } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => listFn(),
  });

  async function generate() {
    const p = prompt.trim();
    if (p.length < 3) return toast.error(locale === "ar" ? "الوصف قصير جداً" : "Prompt too short");
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("no session");
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: p, quality, aspect }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 402 && j.error === "INSUFFICIENT_CREDITS") {
          toast.error(t("error_insufficient_credits"));
        } else if (res.status === 503) {
          toast.error(
            locale === "ar"
              ? "الخدمة غير مفعّلة بعد، البنية جاهزة."
              : "AI service not yet activated.",
          );
        } else {
          toast.error(j.error ?? t("error_generic"));
        }
        return;
      }
      await res.json();
      toast.success(locale === "ar" ? "تم إنشاء الصورة" : "Image generated");
      qc.invalidateQueries({ queryKey: ["gallery"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await delFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["gallery"] });
  }

  const chosen = IMAGE_QUALITIES.find((q) => q.id === quality)!;
  const qLabel: Record<ImageQualityId, string> = {
    fast: t("q_fast"),
    standard: t("q_standard"),
    pro: t("q_pro"),
    realistic: t("q_realistic"),
    cinematic: t("q_cinematic"),
    ultra: t("q_ultra"),
    master: t("q_master"),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">{t("images")}</h1>

      <Card className="mb-6 space-y-4 border-border/60 bg-card p-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("image_placeholder")}
          rows={3}
          maxLength={1200}
          className="resize-none"
        />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("quality")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("cost")}: <span className="font-bold text-primary">{costOf(chosen.id)}</span>{" "}
              {t("credits_short")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {IMAGE_QUALITIES.map((q) => (
              <button
                key={q.id}
                onClick={() => setQuality(q.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  quality === q.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-secondary-foreground hover:border-primary/50",
                )}
              >
                {qLabel[q.id]} · {costOf(q.id)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-muted-foreground">
            {locale === "ar" ? "المقاس" : "Aspect ratio"}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {IMAGE_ASPECTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspect(a.id)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-xs font-medium transition",
                  aspect === a.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-secondary-foreground hover:border-primary/50",
                )}
              >
                {locale === "ar" ? a.labelAr : a.labelEn}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={generate}
          disabled={busy || !prompt.trim()}
          className="h-11 w-full gap-2 font-semibold"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {t("generate")}
        </Button>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        {locale === "ar" ? "معرضك" : "Your gallery"}
      </h2>
      {gallery.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("no_history")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card"
            >
              <button
                type="button"
                onClick={() => setViewer(img)}
                className="block w-full"
                aria-label={img.prompt}
              >
                <img
                  src={img.image_data}
                  alt={img.prompt}
                  loading="lazy"
                  draggable={false}
                  className="aspect-square w-full object-cover [-webkit-touch-callout:none] select-none"
                />
              </button>
              <button
                onClick={() => remove(img.id)}
                aria-label="delete"
                className="absolute bottom-2 left-2 rounded-lg bg-black/45 p-1.5 backdrop-blur transition hover:bg-destructive/70"
              >
                <Trash2 className="size-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ImageViewer image={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}