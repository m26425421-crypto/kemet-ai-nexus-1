import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText } from "lucide-react";
import { TaskRunner } from "@/components/task-runner";
import { TASK_PROMPTS } from "@/lib/task-prompts";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/feature/summarizer")({
  component: SummarizerFeature,
});

function SummarizerFeature() {
  const { locale } = useI18n();
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");

  return (
    <TaskRunner
      title={locale === "ar" ? "تلخيص النصوص" : "Text Summarizer"}
      subtitle={
        locale === "ar"
          ? "لخّص أي نص أو مقال أو كتاب طويل"
          : "Summarize any text, article, or long document"
      }
      icon={<FileText className="size-5" />}
      inputLabel={locale === "ar" ? "النص المراد تلخيصه" : "Text to summarize"}
      inputPlaceholder={
        locale === "ar" ? "الصق النص هنا (يدعم النصوص الطويلة)..." : "Paste your text here..."
      }
      actionLabel={locale === "ar" ? "لخّص الآن" : "Summarize"}
      system={TASK_PROMPTS.summarizer}
      maxLength={20000}
      minLength={50}
      buildUserMessage={(text) => {
        const guide =
          length === "short"
            ? "لخّص باختصار شديد (3-4 نقاط قصيرة)."
            : length === "long"
              ? "قدّم ملخصاً تفصيلياً وافياً."
              : "قدّم ملخصاً متوسطاً متوازناً.";
        return `${guide}\n\nالنص:\n${text}`;
      }}
      downloadFilename="summary.txt"
      controls={
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            {locale === "ar" ? "طول الملخص" : "Summary length"}
          </label>
          <div className="flex gap-2">
            {(["short", "medium", "long"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLength(l)}
                className={
                  "flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition " +
                  (length === l
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-secondary-foreground")
                }
              >
                {locale === "ar"
                  ? { short: "قصير", medium: "متوسط", long: "طويل" }[l]
                  : { short: "Short", medium: "Medium", long: "Long" }[l]}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}