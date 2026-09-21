import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Play, Pause, BookOpen, ChevronRight, ChevronLeft } from "lucide-react";
import {
  RECITERS,
  TAFSIRS,
  ayahAudioUrl,
  getSurah,
  getSurahs,
} from "@/lib/islamic/quran";
import { cn } from "@/lib/utils";

export function QuranTab() {
  const [surahNo, setSurahNo] = useState(1);
  const [reciter, setReciter] = useState(RECITERS[0].id);
  const [tafsir, setTafsir] = useState<string>("ar.muyassar");
  const [showTafsir, setShowTafsir] = useState(false);
  const [filter, setFilter] = useState("");
  const [playing, setPlaying] = useState<number | null>(null);
  const [continuous, setContinuous] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const surahsQ = useQuery({ queryKey: ["quran-surahs"], queryFn: getSurahs, staleTime: Infinity });
  const surahQ = useQuery({
    queryKey: ["quran-surah", surahNo, showTafsir ? tafsir : null],
    queryFn: () => getSurah(surahNo, showTafsir ? tafsir : null),
    staleTime: 10 * 60 * 1000,
  });

  const list = useMemo(() => {
    const all = surahsQ.data ?? [];
    const f = filter.trim();
    if (!f) return all;
    return all.filter(
      (s) => s.name.includes(f) || s.englishName.toLowerCase().includes(f.toLowerCase()) || String(s.number) === f,
    );
  }, [surahsQ.data, filter]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function stop() {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  }

  function playAyah(globalNumber: number) {
    if (playing === globalNumber) return stop();
    audioRef.current?.pause();
    const a = new Audio(ayahAudioUrl(reciter, globalNumber));
    audioRef.current = a;
    setPlaying(globalNumber);
    a.onended = () => {
      const ayahs = surahQ.data?.ayahs ?? [];
      const idx = ayahs.findIndex((x) => x.number === globalNumber);
      if (continuous && idx >= 0 && idx + 1 < ayahs.length) {
        playAyah(ayahs[idx + 1].number);
      } else {
        setPlaying(null);
      }
    };
    a.onerror = () => setPlaying(null);
    void a.play().catch(() => setPlaying(null));
  }

  const meta = surahQ.data?.meta;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit p-3">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="ابحث عن سورة…"
          className="mb-2"
        />
        <div className="max-h-[320px] space-y-1 overflow-y-auto lg:max-h-[70vh]">
          {surahsQ.isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {list.map((s) => (
            <button
              key={s.number}
              type="button"
              onClick={() => {
                stop();
                setSurahNo(s.number);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                s.number === surahNo
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/40 text-foreground hover:bg-secondary",
              )}
            >
              <span className="font-semibold">{s.name}</span>
              <span className="text-xs opacity-70">{s.numberOfAyahs} آية</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <Card className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={reciter}
              onValueChange={(v) => {
                stop();
                setReciter(v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="القارئ" />
              </SelectTrigger>
              <SelectContent>
                {RECITERS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tafsir} onValueChange={setTafsir}>
              <SelectTrigger>
                <SelectValue placeholder="التفسير" />
              </SelectTrigger>
              <SelectContent>
                {TAFSIRS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={showTafsir ? "default" : "secondary"}
              onClick={() => setShowTafsir((v) => !v)}
            >
              <BookOpen className="size-4" /> {showTafsir ? "إخفاء التفسير" : "إظهار التفسير"}
            </Button>
            <Button
              size="sm"
              variant={continuous ? "default" : "secondary"}
              onClick={() => setContinuous((v) => !v)}
            >
              تشغيل متتابع
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const ayahs = surahQ.data?.ayahs ?? [];
                if (ayahs.length) {
                  setContinuous(true);
                  playAyah(ayahs[0].number);
                }
              }}
            >
              <Play className="size-4" /> استمع للسورة
            </Button>
            {playing !== null && (
              <Button size="sm" variant="secondary" onClick={stop}>
                <Pause className="size-4" /> إيقاف
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="ghost"
              disabled={surahNo <= 1}
              onClick={() => {
                stop();
                setSurahNo((n) => Math.max(1, n - 1));
              }}
            >
              <ChevronRight className="size-4" /> السابقة
            </Button>
            <div className="text-center text-sm font-semibold">
              {meta ? `${meta.name} — ${meta.revelationType === "Meccan" ? "مكية" : "مدنية"}` : "…"}
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={surahNo >= 114}
              onClick={() => {
                stop();
                setSurahNo((n) => Math.min(114, n + 1));
              }}
            >
              التالية <ChevronLeft className="size-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          {surahQ.isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {surahQ.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              تعذّر تحميل السورة. تحقق من الاتصال بالإنترنت وحاول مرة أخرى.
            </p>
          )}
          <div className="space-y-3">
            {(surahQ.data?.ayahs ?? []).map((a) => (
              <div
                key={a.number}
                className={cn(
                  "rounded-xl border p-3 transition",
                  playing === a.number ? "border-primary bg-primary/5" : "border-border/60",
                )}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => playAyah(a.number)}
                    className="mt-1 shrink-0 rounded-full bg-secondary p-2 text-secondary-foreground"
                    aria-label="تشغيل الآية"
                  >
                    {playing === a.number ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                  <p className="flex-1 text-right text-xl leading-[2.4] [font-family:'Amiri','Scheherazade New',serif]">
                    {a.text}
                    <span className="mx-1 inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                      {a.numberInSurah}
                    </span>
                  </p>
                </div>
                {showTafsir && a.tafsir && (
                  <p className="mt-2 rounded-lg bg-secondary/40 p-2 text-sm leading-7 text-muted-foreground">
                    {a.tafsir}
                    <span className="mt-1 block text-[11px] opacity-70">
                      المصدر: {TAFSIRS.find((t) => t.id === tafsir)?.name}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
