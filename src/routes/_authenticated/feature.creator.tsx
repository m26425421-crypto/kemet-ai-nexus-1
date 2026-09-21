import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { TaskRunner } from "@/components/task-runner";
import { TASK_PROMPTS } from "@/lib/task-prompts";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/feature/creator")({
  component: CreatorFeature,
});

const PLATFORMS = [
  { id: "youtube", ar: "YouTube", en: "YouTube" },
  { id: "tiktok", ar: "TikTok", en: "TikTok" },
  { id: "instagram", ar: "Instagram", en: "Instagram" },
  { id: "shorts", ar: "Shorts/Reels", en: "Shorts/Reels" },
];

function CreatorFeature() {
  const { locale } = useI18n();
  const [platform, setPlatform] = useState("youtube");

  return (
    <TaskRunner
      title={locale === "ar" ? "استوديو صانع المحتوى" : "Creator Studio"}
      subtitle={locale === "ar" ? "عناوين، أوصاف، سكربتات، Thumbnails" : "Titles, descriptions, scripts, thumbnails"}
      icon={<Clapperboard className="size-5" />}
      inputLabel={locale === "ar" ? "فكرة الفيديو / المنشور" : "Video / post idea"}
      inputPlaceholder={locale === "ar" ? "مثال: أفضل 10 آيات للتدبر..." : "Example: Top 10 productivity hacks..."}
      actionLabel={locale === "ar" ? "أنشئ الحزمة" : "Generate pack"}
      system={TASK_PROMPTS.creator}
      buildUserMessage={(text) =>
        `المنصة: ${platform}\nالفكرة: ${text}\n\nأعطني حزمة محتوى كاملة وجاهزة للنشر.`
      }
      downloadFilename="content-pack.txt"
      controls={
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            {locale === "ar" ? "المنصة" : "Platform"}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition " +
                  (platform === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-secondary-foreground")
                }
              >
                {locale === "ar" ? p.ar : p.en}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}