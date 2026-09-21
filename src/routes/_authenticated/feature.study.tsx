import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { TaskRunner } from "@/components/task-runner";
import { TASK_PROMPTS } from "@/lib/task-prompts";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/feature/study")({
  component: StudyFeature,
});

const MODES = [
  { id: "explain", ar: "اشرح المفهوم", en: "Explain concept" },
  { id: "quiz", ar: "أنشئ أسئلة", en: "Create quiz" },
  { id: "summary", ar: "ملخص", en: "Summary" },
  { id: "flashcards", ar: "بطاقات مذاكرة", en: "Flashcards" },
];

function StudyFeature() {
  const { locale } = useI18n();
  const [mode, setMode] = useState("explain");

  return (
    <TaskRunner
      title={locale === "ar" ? "مساعد المذاكرة" : "Study Assistant"}
      subtitle={locale === "ar" ? "شرح، أسئلة، بطاقات وملخصات" : "Explain, quiz, flashcards & summaries"}
      icon={<GraduationCap className="size-5" />}
      inputLabel={locale === "ar" ? "الموضوع أو الدرس" : "Topic or lesson"}
      inputPlaceholder={locale === "ar" ? "مثال: قانون نيوتن الثاني..." : "Example: Newton's second law..."}
      actionLabel={locale === "ar" ? "ابدأ" : "Start"}
      system={TASK_PROMPTS.study}
      maxLength={8000}
      buildUserMessage={(text) => {
        const map: Record<string, string> = {
          explain: `اشرح لي هذا الموضوع بأسلوب مبسّط مع أمثلة:\n\n${text}`,
          quiz: `أنشئ لي 10 أسئلة متنوعة (5 اختيار من متعدد + 3 صح/خطأ + 2 مقالية) عن:\n\n${text}\n\nمع الإجابات في النهاية.`,
          summary: `اكتب ملخصاً منظماً بنقاط عن:\n\n${text}`,
          flashcards: `أنشئ 10 بطاقات مذاكرة (سؤال/إجابة) عن:\n\n${text}\n\nبصيغة:\nبطاقة 1:\nس: ...\nج: ...`,
        };
        return map[mode] ?? text;
      }}
      downloadFilename="study-notes.txt"
      controls={
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            {locale === "ar" ? "نوع المساعدة" : "Mode"}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition " +
                  (mode === m.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-secondary-foreground")
                }
              >
                {locale === "ar" ? m.ar : m.en}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}