import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Vibrate, VibrateOff } from "lucide-react";
import { cn } from "@/lib/utils";

const PHRASES = [
  { text: "سُبْحَانَ اللَّهِ", target: 33 },
  { text: "الْحَمْدُ لِلَّهِ", target: 33 },
  { text: "اللَّهُ أَكْبَرُ", target: 34 },
  { text: "لَا إِلَهَ إِلَّا اللَّهُ", target: 100 },
  { text: "أَسْتَغْفِرُ اللَّهَ", target: 100 },
  { text: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", target: 100 },
  { text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", target: 100 },
];

type Saved = { index: number; count: number; total: number; haptics: boolean };
const KEY = "kemet-tasbih-v1";

export function TasbihTab() {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [haptics, setHaptics] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw) as Saved;
        setIndex(s.index ?? 0);
        setCount(s.count ?? 0);
        setTotal(s.total ?? 0);
        setHaptics(s.haptics ?? true);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ index, count, total, haptics } satisfies Saved));
  }, [ready, index, count, total, haptics]);

  const phrase = PHRASES[index];
  const progress = Math.min(100, (count / phrase.target) * 100);

  function tap() {
    const next = count + 1;
    setCount(next);
    setTotal((t) => t + 1);
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(next >= phrase.target ? [30, 40, 30] : 12);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-3">
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {PHRASES.map((p, i) => (
            <button
              key={p.text}
              type="button"
              onClick={() => {
                setIndex(i);
                setCount(0);
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                i === index
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-secondary-foreground",
              )}
            >
              {p.text}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col items-center gap-4 p-6">
        <p className="text-center text-2xl font-semibold leading-relaxed">{phrase.text}</p>
        <button
          type="button"
          onClick={tap}
          className="relative flex size-52 select-none items-center justify-center rounded-full bg-primary/10 text-5xl font-bold text-primary transition active:scale-95 [-webkit-touch-callout:none]"
          style={{
            backgroundImage: `conic-gradient(hsl(var(--primary)/0.45) ${progress}%, hsl(var(--primary)/0.08) ${progress}%)`,
          }}
          aria-label="تسبيح"
        >
          <span className="flex size-40 items-center justify-center rounded-full bg-card shadow-inner">
            {count}
          </span>
        </button>
        <p className="text-sm text-muted-foreground">
          الهدف: {phrase.target} — الإجمالي الكلي: {total}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCount(0)}>
            <RotateCcw className="size-4" /> تصفير العدّاد
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setHaptics((v) => !v)}>
            {haptics ? <Vibrate className="size-4" /> : <VibrateOff className="size-4" />}
            {haptics ? "الاهتزاز مفعّل" : "الاهتزاز موقوف"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCount(0);
              setTotal(0);
            }}
          >
            تصفير الكل
          </Button>
        </div>
      </Card>
    </div>
  );
}
