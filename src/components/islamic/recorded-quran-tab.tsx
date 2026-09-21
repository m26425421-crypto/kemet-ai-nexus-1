import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Headphones, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSurahs, SURAH_RECITERS, surahAudioUrl } from "@/lib/islamic/quran";

export function RecordedQuranTab() {
  const [reciterId, setReciterId] = useState("islam-sobhi");
  const [filter, setFilter] = useState("");
  const surahsQ = useQuery({ queryKey: ["quran-surahs"], queryFn: getSurahs, staleTime: Infinity });
  const reciter = SURAH_RECITERS.find((item) => item.id === reciterId) ?? SURAH_RECITERS[0];
  const surahs = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const all = surahsQ.data ?? [];
    if (!term) return all;
    return all.filter((surah) => surah.name.includes(term) || surah.englishName.toLowerCase().includes(term) || String(surah.number) === term);
  }, [filter, surahsQ.data]);

  return (
    <div className="space-y-3">
      <Card className="grid gap-3 p-3 sm:grid-cols-2">
        <Select value={reciterId} onValueChange={setReciterId}>
          <SelectTrigger><SelectValue placeholder="اختر القارئ" /></SelectTrigger>
          <SelectContent>
            {SURAH_RECITERS.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
          <Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="ابحث عن سورة…" className="pr-9" />
        </div>
      </Card>

      <Card className="border-primary/20 p-3 text-center">
        <Headphones className="mx-auto size-6 text-primary" />
        <p className="mt-1 font-bold">المصحف المرتّل بصوت {reciter.name}</p>
        <p className="text-xs text-muted-foreground">سورة طه رقم 20 متاحة مباشرة ضمن القائمة</p>
      </Card>

      {surahsQ.isLoading && <Loader2 className="mx-auto size-6 animate-spin text-primary" />}
      <div className="space-y-2">
        {surahs.map((surah) => (
          <Card key={surah.number} className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-bold">{surah.name}</p>
              <span className="text-xs text-muted-foreground">{surah.number} · {surah.numberOfAyahs} آية</span>
            </div>
            <audio className="h-11 w-full" controls preload="none" src={surahAudioUrl(reciter.server, surah.number)}>
              متصفحك لا يدعم تشغيل الصوت.
            </audio>
          </Card>
        ))}
      </div>
    </div>
  );
}