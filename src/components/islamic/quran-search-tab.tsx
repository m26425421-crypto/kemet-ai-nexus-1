import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { searchQuran, type SearchMatch } from "@/lib/islamic/quran";

export function QuranSearchTab() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchMatch[] | null>(null);

  async function run() {
    const term = q.trim();
    if (term.length < 2) {
      setError("اكتب كلمتين على الأقل للبحث.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await searchQuran(term);
      setResults(r);
    } catch {
      setResults([]);
      setError("تعذّر تنفيذ البحث الآن. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Card className="flex flex-col gap-2 p-3 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="ابحث عن كلمة أو جملة في القرآن الكريم…"
        />
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} بحث
        </Button>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results && (
        <p className="text-sm text-muted-foreground">
          {results.length ? `عدد النتائج المعروضة: ${results.length}` : "لا توجد نتائج مطابقة."}
        </p>
      )}

      <div className="space-y-2">
        {(results ?? []).map((m) => (
          <Card key={m.number} className="p-3">
            <p className="text-right text-lg leading-[2.2] [font-family:'Amiri',serif]">{m.text}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              سورة {m.surah.name} — الآية {m.numberInSurah}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
