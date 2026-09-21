import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Video,
  Sparkles,
  Loader2,
  Download,
  Share2,
  Image as ImageIcon,
  Type,
  Clock,
  Wallet,
  Film,
} from "lucide-react";
import { useSettings } from "@/lib/settings";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/credits.functions";
import { useSession } from "@/lib/session";
import { VIDEO_ASPECTS, type VideoAspectId } from "@/lib/features";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/video-studio")({
  component: VideoStudio,
});

const DURATIONS = [
  { seconds: 6, cost: 20, labelAr: "6 ثواني", labelEn: "6 seconds" },
  { seconds: 30, cost: 100, labelAr: "30 ثانية", labelEn: "30 seconds" },
  { seconds: 60, cost: 180, labelAr: "دقيقة", labelEn: "1 minute" },
  { seconds: 180, cost: 300, labelAr: "3 دقائق", labelEn: "3 minutes" },
  { seconds: 300, cost: 500, labelAr: "5 دقائق", labelEn: "5 minutes" },
  { seconds: 600, cost: 1000, labelAr: "10 دقائق", labelEn: "10 minutes" },
] as const;

type Mode = "t2v" | "i2v";

type Progress = {
  status: "processing" | "completed" | "refunded" | "failed";
  progress: number;
  currentSegment: number;
  totalSegments: number;
  segmentStatus?: string;
  queuePosition?: number;
  finalUrl?: string;
  segments?: string[];
  error?: string;
};

function errorMessage(code: string, locale: "ar" | "en"): string {
  const ar: Record<string, string> = {
    INSUFFICIENT_CREDITS: "رصيدك من الكريدت غير كافٍ لهذه المدة.",
    FAL_NOT_CONFIGURED: "خدمة توليد الفيديو غير مفعّلة، تواصل مع الدعم.",
    FAL_INVALID_KEY: "مفتاح Fal.ai غير صالح. راجع الإعدادات.",
    FAL_RATE_LIMIT: "تم تجاوز الحد المسموح مؤقتاً، حاول بعد قليل.",
    UNAUTHORIZED: "الجلسة انتهت، سجّل الدخول من جديد.",
    PROMPT_TOO_SHORT: "الوصف قصير جداً، اكتب فكرة أوضح.",
    PROMPT_TOO_LONG: "الوصف طويل جداً، قصّره قليلاً.",
    IMAGE_URL_REQUIRED: "أضف صورة أو رابط صورة أولاً.",
    IMAGE_REQUIRED: "أضف صورة أو رابط صورة أولاً.",
    INVALID_DURATION: "المدة غير مدعومة.",
    NETWORK_ERROR: "فشل الاتصال بالشبكة، تحقق من الإنترنت وحاول مجدداً.",
    TIMEOUT: "انتهت المهلة، حاول مرة أخرى.",
  };
  const en: Record<string, string> = {
    INSUFFICIENT_CREDITS: "You don't have enough credits for this duration.",
    FAL_NOT_CONFIGURED: "Video generation is not configured. Contact support.",
    FAL_INVALID_KEY: "Fal.ai key is invalid. Check settings.",
    FAL_RATE_LIMIT: "Rate limit hit, try again shortly.",
    UNAUTHORIZED: "Session expired, please sign in again.",
    PROMPT_TOO_SHORT: "Prompt too short, be more descriptive.",
    PROMPT_TOO_LONG: "Prompt too long, shorten it a bit.",
    IMAGE_URL_REQUIRED: "Add an image or image URL first.",
    IMAGE_REQUIRED: "Add an image or image URL first.",
    INVALID_DURATION: "Duration not supported.",
    NETWORK_ERROR: "Network failed. Check your connection and retry.",
    TIMEOUT: "Timed out, please retry.",
  };
  const dict = locale === "ar" ? ar : en;
  if (dict[code]) return dict[code];
  if (code.startsWith("FAL_")) {
    return locale === "ar"
      ? "خدمة Fal.ai أعادت خطأ، حاول مجدداً بعد قليل."
      : "Fal.ai returned an error. Please retry shortly.";
  }
  return locale === "ar" ? "حدث خطأ غير متوقع." : "Something went wrong.";
}

function VideoStudio() {
  const { locale } = useI18n();
  const { user } = useSession();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(),
    enabled: !!user,
  });

  const [mode, setMode] = useState<Mode>("t2v");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<VideoAspectId>("landscape");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]["seconds"]>(6);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const pollTimer = useRef<number | null>(null);

  const settings = useSettings();
  const baseSpec = DURATIONS.find((d) => d.seconds === duration)!;
  const costOf = (seconds: number) => {
    const base = DURATIONS.find((d) => d.seconds === seconds)!.cost;
    return settings.num(`cost.video_${seconds}s`, base);
  };
  const durationSpec = { ...baseSpec, cost: costOf(duration) };
  const balance = profile?.isDeveloper ? Infinity : (profile?.credits ?? 0);
  const hasEnough = balance >= durationSpec.cost;

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, []);

  async function onPickImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(locale === "ar" ? "الرجاء اختيار صورة" : "Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error(locale === "ar" ? "الحد الأقصى 8 ميجابايت" : "Max 8 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function reset() {
    setJobId(null);
    setProgress(null);
    setStartedAt(null);
    setBusy(false);
    if (pollTimer.current) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }

  async function callApi(path: string, body: unknown) {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) throw new Error("UNAUTHORIZED");
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* ignore */
    }
    if (!res.ok) {
      const obj = (parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {});
      const code = "error" in obj ? String(obj.error) : `HTTP_${res.status}`;
      const message = "message" in obj ? String(obj.message) : "";
      const err = new Error(code) as Error & { friendly?: string };
      if (message) err.friendly = message;
      throw err;
    }
    return parsed as Record<string, unknown>;
  }

  async function confirmAndGenerate() {
    if (!hasEnough) {
      toast.error(errorMessage("INSUFFICIENT_CREDITS", locale));
      return;
    }
    if (prompt.trim().length < 3) {
      toast.error(errorMessage("PROMPT_TOO_SHORT", locale));
      return;
    }
    if (mode === "i2v" && !imageUrl) {
      toast.error(errorMessage("IMAGE_REQUIRED", locale));
      return;
    }
    setConfirming(false);
    setBusy(true);
    setProgress({
      status: "processing",
      progress: 0,
      currentSegment: 0,
      totalSegments: 0,
      segmentStatus: "queued",
    });
    setStartedAt(Date.now());
    try {
      const started = await callApi("/api/video-generate", {
        mode,
        prompt: prompt.trim(),
        imageUrl: mode === "i2v" ? imageUrl : undefined,
        duration,
        aspect,
      });
      const id = String(started.jobId);
      setJobId(id);
      setProgress((p) => ({
        status: "processing",
        progress: 0,
        currentSegment: 0,
        totalSegments: Number(started.totalSegments ?? 1),
        segmentStatus: "queued",
        ...(p ?? {}),
      }));
      qc.invalidateQueries({ queryKey: ["profile"] });
      startPolling(id);
    } catch (e) {
      const friendly = (e as { friendly?: string } | undefined)?.friendly;
      const code = e instanceof Error ? e.message : "NETWORK_ERROR";
      toast.error(friendly || errorMessage(code, locale));
      reset();
    }
  }

  function startPolling(id: string) {
    const tick = async () => {
      try {
        const st = (await callApi("/api/video-status", { jobId: id })) as Progress;
        setProgress(st);
        if (st.status === "completed") {
          setBusy(false);
          qc.invalidateQueries({ queryKey: ["myVideos"] });
          toast.success(locale === "ar" ? "تم إنشاء الفيديو" : "Video is ready");
          return;
        }
        if (st.status === "refunded" || st.status === "failed") {
          setBusy(false);
          qc.invalidateQueries({ queryKey: ["profile"] });
          qc.invalidateQueries({ queryKey: ["myVideos"] });
          toast.error(
            (locale === "ar" ? "فشل التوليد، تم استرداد الكريدت. " : "Generation failed, credits refunded. ") +
              errorMessage(st.error ?? "", locale),
          );
          return;
        }
        pollTimer.current = window.setTimeout(tick, 5000);
      } catch (e) {
        // Transient network error — retry a few times.
        pollTimer.current = window.setTimeout(tick, 6000);
        void e;
      }
    };
    pollTimer.current = window.setTimeout(tick, 4000);
  }

  const elapsedSec = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  const estimatedTotal = durationSpec.seconds <= 6 ? 60 : durationSpec.seconds * 4; // rough estimate
  const remaining = Math.max(0, estimatedTotal - elapsedSec);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-500/30 to-red-500/30 text-primary">
            <Video className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {locale === "ar" ? "استوديو الفيديو الذكي" : "AI Video Studio"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {locale === "ar"
                ? "توليد فيديوهات حقيقية عبر Fal.ai — نص أو صورة"
                : "Real video generation via Fal.ai — text or image"}
            </p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/my-videos">
            <Film className="size-4" />
            {locale === "ar" ? "فيديوهاتي" : "My Videos"}
          </Link>
        </Button>
      </div>

      {/* Mode selector */}
      <Card className="mb-4 p-4">
        <div className="mb-3 grid grid-cols-2 gap-2">
          {(
            [
              { id: "t2v", icon: Type, ar: "نص إلى فيديو", en: "Text → Video" },
              { id: "i2v", icon: ImageIcon, ar: "صورة إلى فيديو", en: "Image → Video" },
            ] as const
          ).map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  mode === m.id
                    ? "border-primary bg-primary text-primary-foreground shadow-glow"
                    : "border-border bg-secondary text-secondary-foreground hover:border-primary/40",
                )}
              >
                <Icon className="size-4" />
                {locale === "ar" ? m.ar : m.en}
              </button>
            );
          })}
        </div>

        {mode === "i2v" && (
          <div className="mb-3 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "الصورة" : "Image"}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickImage(f);
                  }}
                />
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium">
                  <ImageIcon className="size-3.5" />
                  {locale === "ar" ? "اختر صورة" : "Choose image"}
                </span>
              </label>
              <Input
                type="url"
                placeholder={locale === "ar" ? "أو الصق رابط صورة" : "or paste image URL"}
                value={imageUrl.startsWith("data:") ? "" : imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(e.target.value);
                }}
                className="h-9 flex-1 min-w-0"
              />
            </div>
            {imagePreview && (
              <img
                src={imagePreview}
                alt=""
                className="max-h-40 rounded-lg border border-border object-contain"
              />
            )}
          </div>
        )}

        <label className="text-xs font-semibold text-muted-foreground">
          {locale === "ar" ? "وصف الفيديو" : "Video prompt"}
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={
            locale === "ar"
              ? "مثال: طائر يحلق فوق أهرامات الجيزة عند غروب الشمس، لقطة سينمائية بطيئة..."
              : "Example: A bird soaring above the pyramids of Giza at sunset, slow cinematic shot..."
          }
          className="mt-1.5 resize-none"
        />

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            {locale === "ar" ? "المقاس" : "Aspect"}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {VIDEO_ASPECTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAspect(a.id)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-[11px] font-medium transition",
                  aspect === a.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-secondary-foreground",
                )}
              >
                {locale === "ar" ? a.labelAr : a.labelEn}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            {locale === "ar" ? "المدة والتكلفة" : "Duration & cost"}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DURATIONS.map((d) => {
              const active = duration === d.seconds;
              return (
                <button
                  key={d.seconds}
                  type="button"
                  onClick={() => setDuration(d.seconds)}
                  className={cn(
                    "flex flex-col items-center rounded-xl border px-2 py-2.5 text-xs transition",
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-glow"
                      : "border-border bg-secondary text-secondary-foreground hover:border-primary/40",
                  )}
                >
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="size-3" />
                    {locale === "ar" ? d.labelAr : d.labelEn}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[10px] opacity-80">
                    <Sparkles className="size-2.5" />
                    {costOf(d.seconds)} {locale === "ar" ? "كريدت" : "credits"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="size-4 text-primary" />
            <span className="text-muted-foreground">
              {locale === "ar" ? "رصيدك:" : "Balance:"}
            </span>
            <span className="font-semibold tabular-nums">
              {profile?.isDeveloper ? "∞" : (profile?.credits ?? 0)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">
              {locale === "ar" ? "التكلفة:" : "Cost:"}{" "}
            </span>
            <span className={cn("font-bold", !hasEnough && "text-destructive")}>
              {durationSpec.cost} {locale === "ar" ? "كريدت" : "cr"}
            </span>
          </div>
        </div>

        <Button
          onClick={() => setConfirming(true)}
          disabled={busy || !hasEnough || prompt.trim().length < 3 || (mode === "i2v" && !imageUrl)}
          className="mt-4 h-12 w-full gap-2 text-base font-bold"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {locale === "ar" ? "جاري التوليد..." : "Generating..."}
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              {locale === "ar" ? "توليد الفيديو" : "Generate Video"}
            </>
          )}
        </Button>

        {!hasEnough && !busy && (
          <p className="mt-2 text-center text-xs text-destructive">
            {locale === "ar"
              ? "رصيدك لا يكفي. اذهب للمتجر لشراء كريدت."
              : "Not enough credits. Visit the store to top up."}
          </p>
        )}
      </Card>

      {/* Confirm dialog */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
          onClick={() => setConfirming(false)}
        >
          <Card
            className="w-full max-w-sm animate-scale-in p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="size-5" />
              </div>
              <h3 className="text-base font-bold">
                {locale === "ar" ? "تأكيد التوليد" : "Confirm generation"}
              </h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {locale === "ar"
                ? `سيتم خصم ${durationSpec.cost} كريدت لإنشاء فيديو مدته ${durationSpec.labelAr}. عند فشل التوليد يتم استرداد الرصيد تلقائياً.`
                : `${durationSpec.cost} credits will be deducted for a ${durationSpec.labelEn} video. If generation fails, credits are automatically refunded.`}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setConfirming(false)} className="flex-1">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={confirmAndGenerate} className="flex-1 font-semibold">
                {locale === "ar" ? "تأكيد" : "Confirm"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Progress + result */}
      {progress && (
        <Card className="mt-4 p-4">
          {progress.status === "processing" && (
            <div className="py-6 text-center">
              <div className="relative mx-auto mb-4 size-20">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="absolute inset-2 grid place-items-center rounded-full bg-primary/15 text-primary">
                  <Loader2 className="size-8 animate-spin" />
                </div>
              </div>
              <div className="mb-2 text-sm font-semibold">
                {locale === "ar"
                  ? `جاري إنشاء الفيديو... (${progress.currentSegment + 1}/${Math.max(progress.totalSegments, 1)})`
                  : `Generating... (${progress.currentSegment + 1}/${Math.max(progress.totalSegments, 1)})`}
              </div>
              <div className="mx-auto mb-2 h-2 max-w-xs overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{
                    width: `${Math.max(6, Math.round((progress.progress ?? 0) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "الوقت المتبقي التقريبي:" : "Estimated remaining:"}{" "}
                <span className="tabular-nums font-semibold">
                  {remaining >= 60
                    ? `${Math.floor(remaining / 60)}m ${remaining % 60}s`
                    : `${remaining}s`}
                </span>
              </p>
              {progress.segmentStatus === "queued" && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {locale === "ar" ? "في قائمة الانتظار..." : "In queue..."}
                </p>
              )}
            </div>
          )}

          {progress.status === "completed" && progress.segments && (
            <VideoResult
              segments={progress.segments}
              prompt={prompt}
              onReset={reset}
              jobId={jobId ?? undefined}
            />
          )}

          {(progress.status === "refunded" || progress.status === "failed") && (
            <div className="py-6 text-center">
              <p className="mb-3 text-sm font-semibold text-destructive">
                {locale === "ar" ? "فشل التوليد" : "Generation failed"}
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                {errorMessage(progress.error ?? "", locale)}
              </p>
              <Button onClick={reset} variant="secondary" size="sm">
                {locale === "ar" ? "حاول من جديد" : "Try again"}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function VideoResult({
  segments,
  prompt,
  onReset,
  jobId,
}: {
  segments: string[];
  prompt: string;
  onReset: () => void;
  jobId?: string;
}) {
  const { locale } = useI18n();

  async function download(url: string, index: number) {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const a = document.createElement("a");
      const dlUrl = URL.createObjectURL(blob);
      a.href = dlUrl;
      a.download = `kemet-video-${jobId ?? "output"}${segments.length > 1 ? `-${index + 1}` : ""}.mp4`;
      a.click();
      URL.revokeObjectURL(dlUrl);
    } catch {
      // fallback: open in new tab
      window.open(url, "_blank");
    }
  }

  async function share(url: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title: "KEMET AI Video", text: prompt, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success(locale === "ar" ? "تم نسخ الرابط" : "Link copied");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {locale === "ar" ? "الفيديو جاهز 🎬" : "Video ready 🎬"}
        </span>
        <Button variant="ghost" size="sm" onClick={onReset}>
          {locale === "ar" ? "إنشاء آخر" : "New video"}
        </Button>
      </div>
      {segments.map((url, i) => (
        <div key={i} className="space-y-2">
          {segments.length > 1 && (
            <div className="text-xs font-medium text-muted-foreground">
              {locale === "ar" ? `المقطع ${i + 1}` : `Segment ${i + 1}`}
            </div>
          )}
          <video
            src={url}
            controls
            playsInline
            className="w-full rounded-xl border border-border bg-black"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => download(url, i)}
              variant="secondary"
              size="sm"
              className="flex-1 gap-1.5"
            >
              <Download className="size-3.5" />
              {locale === "ar" ? "تنزيل" : "Download"}
            </Button>
            <Button
              onClick={() => share(url)}
              variant="secondary"
              size="sm"
              className="flex-1 gap-1.5"
            >
              <Share2 className="size-3.5" />
              {locale === "ar" ? "مشاركة" : "Share"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}