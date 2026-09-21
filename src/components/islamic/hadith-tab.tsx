import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import {
  HADITH_BOOKS,
  getFullEdition,
  getHadithSection,
  searchHadiths,
  type HadithItem,
} from "@/lib/islamic/hadith";

export function HadithTab() {
  const [bookId, setBookId] = useState<"bukhari" | "muslim">("bukhari");
  const book = HADITH_BOOKS.find((b) => b.id === bookId)!;
  const [section, setSection] = useState<number>(book.sections[0].n);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<HadithItem[] | null>(null);

  const sectionQ = useQuery({
    queryKey: ["hadith-section", book.edition, section],
    queryFn: () => getHadithSection(book.edition, section),
    staleTime: 10 * 60 * 1000,
  });

  const items = useMemo(() => searchResults ?? sectionQ.data ?? [], [searchResults, sectionQ.data]);

  async function runSearch() {
    const term = query.trim();
    if (term.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const all = await getFullEdition(book.edition);
      setSearchResults(searchHadiths(all, term));
    } catch {
      toast.error("تعذّر تحميل فهرس البحث، حاول مرة أخرى");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-2 p-3">
        <p className="text-xs text-muted-foreground">
          المصدر: صحيح البخاري وصحيح مسلم فقط — أصحّ كتب الحديث، مع رقم الحديث في أصل الكتاب.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Select
            value={bookId}
            onValueChange={(v) => {
              const id = v as "bukhari" | "muslim";
              setBookId(id);
              setSearchResults(null);
              setSection(HADITH_BOOKS.find((b) => b.id === id)!.sections[0].n);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HADITH_BOOKS.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(section)}
            onValueChange={(v) => {
              setSearchResults(null);
              setSection(Number(v));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {book.sections.map((s) => (
                <SelectItem key={s.n} value={String(s.n)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder={`ابحث داخل ${book.name}…`}
          />
          <Button onClick={runSearch} disabled={searching}>
            {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} بحث
          </Button>
          {searchResults && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchResults(null);
                setQuery("");
              }}
            >
              إلغاء البحث
            </Button>
          )}
        </div>
      </Card>

      {sectionQ.isLoading && !searchResults && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {sectionQ.isError && !searchResults && (
        <p className="py-6 text-center text-sm text-destructive">تعذّر تحميل الأحاديث، حاول مرة أخرى.</p>
      )}
      {searchResults && searchResults.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">لا توجد أحاديث مطابقة.</p>
      )}

      <div className="space-y-2">
        {items.map((h) => (
          <Card key={`${book.id}-${h.hadithnumber}`} className="p-3">
            <p className="text-right text-lg leading-[2.2]">{h.text}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {book.name} — حديث رقم {h.hadithnumber}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `${h.text}\n\n(${book.name} — حديث رقم ${h.hadithnumber})`,
                  );
                  toast.success("تم نسخ الحديث");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
