import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Video } from "lucide-react";
import { TaskRunner } from "@/components/task-runner";
import { TASK_PROMPTS } from "@/lib/task-prompts";
import { useI18n } from "@/lib/i18n";
import { VIDEO_ASPECTS, type VideoAspectId } from "@/lib/features";

export const Route = createFileRoute("/_authenticated/feature/videos")({
  component: VideosFeature,
});

function VideosFeature() {
  const { locale } = useI18n();
  const [aspect, setAspect] = useState<VideoAspectId>("landscape");
  const [duration, setDuration] = useState<"30" | "60" | "180">("60");

  return (
    <TaskRunner
      title={locale === "ar" ? "استوديو الفيديو AI" : "AI Video Studio"}
      subtitle={
        locale === "ar"
          ? "سكربت + ستوري بورد + عنوان + وصف — جاهز للتصوير أو للتوليد"
          : "Script + storyboard + title + description — ready to shoot or generate"
      }
      icon={<Video className="size-5" />}
      inputLabel={locale === "ar" ? "فكرة الفيديو" : "Video idea"}
      inputPlaceholder={
        locale === "ar"
          ? "مثال: خمس نصائح لزيادة الإنتاجية..."
          : "Example: Five productivity tips..."
      }
      actionLabel={locale === "ar" ? "أنشئ الفيديو" : "Generate"}
      system={TASK_PROMPTS.videos}
      buildUserMessage={(text) =>
        `المقاس: ${aspect}\nالمدة المستهدفة: ${duration} ثانية\nالفكرة: ${text}\n\nأعطني حزمة إنتاج كاملة.`
      }
      downloadFilename="video-pack.txt"
      controls={
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "المقاس" : "Aspect"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VIDEO_ASPECTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAspect(a.id)}
                  className={
                    "rounded-lg border px-2 py-1.5 text-[11px] font-medium transition " +
                    (aspect === a.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground")
                  }
                >
                  {locale === "ar" ? a.labelAr : a.labelEn}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "المدة" : "Duration"}
            </label>
            <div className="flex gap-2">
              {(["30", "60", "180"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={
                    "flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition " +
                    (duration === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground")
                  }
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
          <p className="rounded-lg bg-amber-500/10 p-2 text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
            {locale === "ar"
              ? "🎬 حالياً نُنتج حزمة سكربت + ستوري بورد احترافية. توليد الفيديو الحقيقي (mp4) قيد الإعداد ويستهلك كريدت أعلى."
              : "🎬 Currently produces a full pro script + storyboard pack. Real video (mp4) generation is being wired next."}
          </p>
        </div>
      }
    />
  );
}