import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Code2 } from "lucide-react";
import { TaskRunner } from "@/components/task-runner";
import { TASK_PROMPTS } from "@/lib/task-prompts";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/feature/programming")({
  component: ProgrammingFeature,
});

const MODES = [
  { id: "explain", ar: "اشرح", en: "Explain" },
  { id: "fix", ar: "أصلح", en: "Fix bugs" },
  { id: "write", ar: "اكتب", en: "Write" },
  { id: "refactor", ar: "حسّن", en: "Refactor" },
  { id: "convert", ar: "حوّل", en: "Convert" },
];

const LANGS = ["JavaScript", "TypeScript", "Python", "Java", "C#", "Go", "Rust", "PHP", "Swift", "Kotlin", "SQL", "HTML/CSS"];

function ProgrammingFeature() {
  const { locale } = useI18n();
  const [mode, setMode] = useState("write");
  const [lang, setLang] = useState("TypeScript");

  return (
    <TaskRunner
      title={locale === "ar" ? "مساعد البرمجة" : "Coding Assistant"}
      subtitle={
        locale === "ar"
          ? "شرح، إصلاح، كتابة وتحسين الكود"
          : "Explain, fix, write and refactor code"
      }
      icon={<Code2 className="size-5" />}
      inputLabel={locale === "ar" ? "الكود أو الوصف" : "Code or description"}
      inputPlaceholder={
        locale === "ar" ? "الصق الكود أو اكتب ما تريد..." : "Paste code or describe your task..."
      }
      actionLabel={locale === "ar" ? "نفّذ" : "Run"}
      system={TASK_PROMPTS.programming}
      outputMono
      maxLength={12000}
      buildUserMessage={(text) => {
        const modeLabel = MODES.find((m) => m.id === mode)?.ar ?? mode;
        return `اللغة: ${lang}\nالمطلوب: ${modeLabel}\n\n${text}`;
      }}
      downloadFilename="code-output.txt"
      controls={
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "المهمة" : "Task"}
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {locale === "ar" ? m.ar : m.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "اللغة" : "Language"}
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      }
    />
  );
}