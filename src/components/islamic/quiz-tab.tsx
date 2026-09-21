import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QUIZ_BANK, type QuizQuestion } from "@/data/islamic/quiz";
import { cn } from "@/lib/utils";
import { Trophy, Timer, Flame, RotateCcw } from "lucide-react";

type Mode = { id: "easy" | "medium" | "hard" | "mixed"; label: string; seconds: number; count: number };

const MODES: Mode[] = [
  { id: "easy", label: "تحدي سهل", seconds: 25, count: 10 },
  { id: "medium", label: "تحدي متوسط", seconds: 20, count: 10 },
  { id: "hard", label: "تحدي صعب", seconds: 15, count: 10 },
  { id: "mixed", label: "التحدي الكبير", seconds: 15, count: 15 },
];

const BEST_KEY = "kemet-quiz-best";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizTab() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(BEST_KEY);
    if (raw) setBest(Number(raw) || 0);
  }, []);

  useEffect(() => {
    if (!mode || done || picked !== null) return;
    if (left <= 0) {
      setPicked(-1);
      setStreak(0);
      return;
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [mode, left, picked, done]);

  const current = questions[i];
  const progress = useMemo(
    () => (questions.length ? ((i + (picked !== null ? 1 : 0)) / questions.length) * 100 : 0),
    [i, picked, questions.length],
  );

  function start(m: Mode) {
    const pool = m.id === "mixed" ? QUIZ_BANK : QUIZ_BANK.filter((q) => q.level === m.id);
    const qs = shuffle(pool.length >= m.count ? pool : QUIZ_BANK).slice(0, m.count);
    setMode(m);
    setQuestions(qs);
    setI(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setDone(false);
    setLeft(m.seconds);
  }

  function pick(idx: number) {
    if (picked !== null || !current || !mode) return;
    setPicked(idx);
    if (idx === current.answer) {
      const bonus = 10 + Math.max(0, left) + streak * 2;
      setScore((s) => s + bonus);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }

  function next() {
    if (!mode) return;
    if (i + 1 >= questions.length) {
      setDone(true);
      setBest((b) => {
        const nb = Math.max(b, score);
        localStorage.setItem(BEST_KEY, String(nb));
        return nb;
      });
      return;
    }
    setI((n) => n + 1);
    setPicked(null);
    setLeft(mode.seconds);
  }

  if (!mode) {
    return (
      <Card className="space-y-4 p-6 text-center">
        <Trophy className="mx-auto size-10 text-primary" />
        <h3 className="text-xl font-bold">مسابقة المعلومات الدينية</h3>
        <p className="text-sm text-muted-foreground">
          اختر مستوى التحدي — نقاط أعلى كلما أجبت أسرع وحافظت على سلسلة الإجابات الصحيحة.
        </p>
        <p className="text-sm font-semibold text-primary">أعلى نتيجة لك: {best}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODES.map((m) => (
            <Button key={m.id} onClick={() => start(m)} variant="secondary">
              {m.label} — {m.count} سؤال
            </Button>
          ))}
        </div>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="space-y-4 p-6 text-center">
        <Trophy className="mx-auto size-10 text-primary" />
        <h3 className="text-xl font-bold">انتهى التحدي!</h3>
        <p className="text-3xl font-extrabold text-primary">{score} نقطة</p>
        <p className="text-sm text-muted-foreground">أعلى نتيجة لك: {best}</p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => start(mode)}>
            <RotateCcw className="size-4" /> إعادة التحدي
          </Button>
          <Button variant="secondary" onClick={() => setMode(null)}>
            تغيير المستوى
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-3">
      <Card className="flex items-center justify-between p-3 text-sm">
        <span className="font-semibold">
          سؤال {i + 1} / {questions.length}
        </span>
        <span className="flex items-center gap-1 text-primary">
          <Flame className="size-4" /> {streak}
        </span>
        <span className="flex items-center gap-1">
          <Timer className="size-4" /> {left}s
        </span>
        <span className="font-bold text-primary">{score}</span>
      </Card>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <Card className="space-y-3 p-4">
        <p className="text-lg font-semibold leading-relaxed">{current?.q}</p>
        <div className="grid gap-2">
          {current?.options.map((o, idx) => {
            const isAnswer = idx === current.answer;
            const chosen = picked === idx;
            return (
              <button
                key={o}
                type="button"
                onClick={() => pick(idx)}
                disabled={picked !== null}
                className={cn(
                  "rounded-xl border px-4 py-3 text-right text-sm transition",
                  picked === null
                    ? "border-border bg-secondary/40 hover:bg-secondary"
                    : isAnswer
                      ? "border-primary bg-primary/15 font-semibold"
                      : chosen
                        ? "border-destructive bg-destructive/10"
                        : "border-border opacity-60",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="rounded-lg bg-secondary/50 p-3 text-sm">
            <p>{current?.info}</p>
            <Button className="mt-3 w-full" onClick={next}>
              {i + 1 >= questions.length ? "عرض النتيجة" : "السؤال التالي"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
