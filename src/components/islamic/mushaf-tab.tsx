import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getQuranPage } from "@/lib/islamic/quran";

const TAHA_PAGE = 312;

export function MushafTab() {
  const [page, setPage] = useState(TAHA_PAGE);
  const [draft, setDraft] = useState(String(TAHA_PAGE));
  const pageQ = useQuery({
    queryKey: ["quran-page", page],
    queryFn: () => getQuranPage(page),
    staleTime: Infinity,
  });

  function go(next: number) {
    const safe = Math.min(604, Math.max(1, next));
    setPage(safe);
    setDraft(String(safe));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
        <Button size="sm" variant="secondary" onClick={() => go(TAHA_PAGE)}>
          <BookOpen className="size-4" /> سورة طه
        </Button>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            go(Number(draft) || 1);
          }}
        >
          <span className="text-xs text-muted-foreground">صفحة</span>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            inputMode="numeric"
            className="h-8 w-20 text-center"
            aria-label="رقم الصفحة"
          />
        </form>
      </Card>

      <Card className="relative min-h-[70vh] overflow-hidden border-primary/30 bg-card px-5 py-8 sm:px-10">
        <div className="pointer-events-none absolute inset-2 border border-primary/25" />
        <div className="pointer-events-none absolute inset-4 border border-primary/15" />
        {pageQ.isLoading && <Loader2 className="mx-auto mt-20 size-7 animate-spin text-primary" />}
        {pageQ.isError && <p className="py-20 text-center text-destructive">تعذّر تحميل صفحة المصحف.</p>}
        <div className="relative text-center text-[1.65rem] leading-[2.55] sm:text-3xl sm:leading-[2.7] [font-family:'Amiri','Scheherazade_New',serif]">
          {(pageQ.data ?? []).map((ayah) => (
            <span key={ayah.number}>
              {ayah.text}{" "}
              <span className="inline-flex size-8 items-center justify-center rounded-full border border-primary/50 align-middle text-sm text-primary">
                {ayah.numberInSurah}
              </span>{" "}
            </span>
          ))}
        </div>
        <p className="relative mt-6 text-center text-sm font-bold text-primary">{page}</p>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => go(page - 1)}>
          <ChevronRight className="size-4" /> السابقة
        </Button>
        <Button variant="secondary" disabled={page >= 604} onClick={() => go(page + 1)}>
          التالية <ChevronLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}