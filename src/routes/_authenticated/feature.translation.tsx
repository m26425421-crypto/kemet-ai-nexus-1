import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Languages } from "lucide-react";
import { TaskRunner } from "@/components/task-runner";
import { TASK_PROMPTS } from "@/lib/task-prompts";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/feature/translation")({
  component: TranslationFeature,
});

const LANGS = [
  { id: "ar", ar: "العربية", en: "Arabic" },
  { id: "en", ar: "الإنجليزية", en: "English" },
  { id: "fr", ar: "الفرنسية", en: "French" },
  { id: "es", ar: "الإسبانية", en: "Spanish" },
  { id: "de", ar: "الألمانية", en: "German" },
  { id: "tr", ar: "التركية", en: "Turkish" },
  { id: "it", ar: "الإيطالية", en: "Italian" },
  { id: "ru", ar: "الروسية", en: "Russian" },
  { id: "zh", ar: "الصينية", en: "Chinese" },
  { id: "ja", ar: "اليابانية", en: "Japanese" },
  { id: "ko", ar: "الكورية", en: "Korean" },
  { id: "hi", ar: "الهندية", en: "Hindi" },
  { id: "ur", ar: "الأردية", en: "Urdu" },
  { id: "fa", ar: "الفارسية", en: "Persian" },
];

function TranslationFeature() {
  const { locale } = useI18n();
  const [target, setTarget] = useState("en");
  const targetName = LANGS.find((l) => l.id === target)?.[locale] ?? target;

  return (
    <TaskRunner
      title={locale === "ar" ? "الترجمة الذكية" : "Smart Translation"}
      subtitle={
        locale === "ar"
          ? "ترجم بين 14+ لغة بدقة عالية"
          : "Translate between 14+ languages"
      }
      icon={<Languages className="size-5" />}
      inputLabel={locale === "ar" ? "النص الأصلي" : "Source text"}
      inputPlaceholder={
        locale === "ar" ? "اكتب أو الصق النص هنا..." : "Type or paste text..."
      }
      actionLabel={locale === "ar" ? "ترجم الآن" : "Translate"}
      system={TASK_PROMPTS.translation}
      buildUserMessage={(text) =>
        `ترجم النص التالي إلى ${targetName} فقط، بدون أي شرح إضافي:\n\n${text}`
      }
      downloadFilename="translation.txt"
      controls={
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            {locale === "ar" ? "اللغة الهدف" : "Target language"}
          </label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {locale === "ar" ? l.ar : l.en}
              </option>
            ))}
          </select>
        </div>
      }
    />
  );
}