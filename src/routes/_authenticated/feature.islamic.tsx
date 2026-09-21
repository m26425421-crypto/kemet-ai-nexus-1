import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MoonStar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskRunner } from "@/components/task-runner";
import { TASK_PROMPTS } from "@/lib/task-prompts";
import { useI18n } from "@/lib/i18n";
import { QuranTab } from "@/components/islamic/quran-tab";
import { QuranSearchTab } from "@/components/islamic/quran-search-tab";
import { HadithTab } from "@/components/islamic/hadith-tab";
import { AdhkarTab } from "@/components/islamic/adhkar-tab";
import { TasbihTab } from "@/components/islamic/tasbih-tab";
import { QuizTab } from "@/components/islamic/quiz-tab";
import { DawahCardsTab } from "@/components/islamic/dawah-cards-tab";
import { MushafTab } from "@/components/islamic/mushaf-tab";
import { RecordedQuranTab } from "@/components/islamic/recorded-quran-tab";
import { ZakatTab } from "@/components/islamic/zakat-tab";
import { HalalHaramTab } from "@/components/islamic/halal-haram-tab";

export const Route = createFileRoute("/_authenticated/feature/islamic")({
  head: () => ({
    meta: [
      { title: "الاستوديو الإسلامي — KEMET AI" },
      {
        name: "description",
        content:
          "القرآن الكريم مكتوبًا ومسموعًا بأصوات كبار القرّاء، بحث في القرآن، أحاديث صحيحة، أذكار، سبحة إلكترونية، مسابقة دينية، وبطاقات دعوية.",
      },
      { property: "og:title", content: "الاستوديو الإسلامي — KEMET AI" },
      {
        property: "og:description",
        content: "قرآن مسموع ومكتوب، تفسير بمصادره، أحاديث صحيحة، أذكار، سبحة، مسابقة، وبطاقات دعوية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IslamicFeature,
});

const KINDS = [
  { id: "post", ar: "منشور سوشيال", en: "Social post" },
  { id: "card", ar: "بطاقة تصميم", en: "Design card" },
  { id: "khaater", ar: "خاطرة", en: "Reflection" },
  { id: "dua", ar: "دعاء", en: "Duaa" },
  { id: "quran", ar: "شرح آية", en: "Ayah explanation" },
  { id: "hadith", ar: "شرح حديث", en: "Hadith explanation" },
];

const TABS = [
  { id: "mushaf", label: "المصحف" },
  { id: "quran", label: "القرآن" },
  { id: "recorded", label: "التلاوات" },
  { id: "search", label: "بحث القرآن" },
  { id: "hadith", label: "الأحاديث" },
  { id: "adhkar", label: "الأذكار" },
  { id: "tasbih", label: "السبحة" },
  { id: "quiz", label: "المسابقة" },
  { id: "halal", label: "حلال أم حرام" },
  { id: "zakat", label: "حاسبة الزكاة" },
  { id: "cards", label: "بطاقات دعوية" },
  { id: "ai", label: "مساعد المحتوى" },
];

function IslamicFeature() {
  const { locale } = useI18n();
  const [kind, setKind] = useState("post");

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MoonStar className="size-5" />
        </span>
        <div>
          <h1 className="text-lg font-bold">
            {locale === "ar" ? "الاستوديو الإسلامي" : "Islamic Studio"}
          </h1>
          <p className="text-xs text-muted-foreground">
            قرآن مكتوب ومسموع، بحث، أحاديث صحيحة، أذكار، سبحة، مسابقة، وبطاقات دعوية
          </p>
        </div>
      </div>

      <Tabs defaultValue="mushaf" className="w-full">
        <div className="-mx-1 overflow-x-auto pb-1">
          <TabsList className="inline-flex w-max gap-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="whitespace-nowrap text-xs">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="mushaf" className="mt-3">
          <MushafTab />
        </TabsContent>
        <TabsContent value="quran" className="mt-3">
          <QuranTab />
        </TabsContent>
        <TabsContent value="recorded" className="mt-3">
          <RecordedQuranTab />
        </TabsContent>
        <TabsContent value="search" className="mt-3">
          <QuranSearchTab />
        </TabsContent>
        <TabsContent value="hadith" className="mt-3">
          <HadithTab />
        </TabsContent>
        <TabsContent value="adhkar" className="mt-3">
          <AdhkarTab />
        </TabsContent>
        <TabsContent value="tasbih" className="mt-3">
          <TasbihTab />
        </TabsContent>
        <TabsContent value="quiz" className="mt-3">
          <QuizTab />
        </TabsContent>
        <TabsContent value="halal" className="mt-3">
          <HalalHaramTab />
        </TabsContent>
        <TabsContent value="zakat" className="mt-3">
          <ZakatTab />
        </TabsContent>
        <TabsContent value="cards" className="mt-3">
          <DawahCardsTab />
        </TabsContent>
        <TabsContent value="ai" className="mt-3">
          <TaskRunner
            title={locale === "ar" ? "مساعد المحتوى الدعوي" : "Dawah content assistant"}
            subtitle={
              locale === "ar" ? "منشورات، بطاقات، خواطر، شرح آيات وأحاديث" : "Posts, cards, reflections, Quran & Hadith"
            }
            icon={<MoonStar className="size-5" />}
            inputLabel={locale === "ar" ? "الموضوع أو النص المصدر" : "Topic or source text"}
            inputPlaceholder={locale === "ar" ? "مثال: التوكل على الله..." : "Example: Trust in God..."}
            actionLabel={locale === "ar" ? "أنشئ" : "Generate"}
            system={TASK_PROMPTS.islamic}
            buildUserMessage={(text) => {
              const map: Record<string, string> = {
                post: `اكتب منشوراً إسلامياً راقياً للسوشيال ميديا عن:\n\n${text}\n\nاجعله قصيراً مؤثراً مع هاشتاقات مناسبة.`,
                card: `صمّم لي نصاً لبطاقة تصميم إسلامية (عنوان قصير + جملة رئيسية + توقيع) عن:\n\n${text}`,
                khaater: `اكتب خاطرة إسلامية رقيقة عن:\n\n${text}`,
                dua: `اكتب دعاءً جامعاً من الأدعية المأثورة أو المقبولة شرعاً عن:\n\n${text}`,
                quran: `اشرح الآية أو الموضوع القرآني التالي (المعنى، سبب النزول إن وُجد، الفوائد، التفسير المختصر من مصادر معتبرة):\n\n${text}`,
                hadith: `اشرح الحديث التالي (درجته، شرح المعنى، الفوائد):\n\n${text}`,
              };
              return map[kind] ?? text;
            }}
            downloadFilename="islamic-content.txt"
            controls={
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  {locale === "ar" ? "نوع المحتوى" : "Content type"}
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {KINDS.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setKind(k.id)}
                      className={
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition " +
                        (kind === k.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary text-secondary-foreground")
                      }
                    >
                      {locale === "ar" ? k.ar : k.en}
                    </button>
                  ))}
                </div>
              </div>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
