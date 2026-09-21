// مصدر الأحاديث: مشروع hadith-api مفتوح المصدر (نسخ عربية من صحيح البخاري وصحيح مسلم).
// نعرض الصحيحين فقط، مع اسم الكتاب ورقم الحديث في المصدر.

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

export type HadithItem = {
  hadithnumber: number;
  arabicnumber: number;
  text: string;
};

export type HadithBook = {
  id: "bukhari" | "muslim";
  edition: string;
  name: string;
  short: string;
  sections: { n: number; name: string }[];
};

const BUKHARI_SECTIONS: string[] = [
  "بدء الوحي","الإيمان","العلم","الوضوء","الغسل","الحيض","التيمم","الصلاة","مواقيت الصلاة","الأذان",
  "الجمعة","صلاة الخوف","العيدين","الوتر","الاستسقاء","الكسوف","سجود القرآن","تقصير الصلاة","التهجد",
  "فضل الصلاة في مسجد مكة والمدينة","العمل في الصلاة","السهو","الجنائز","الزكاة","الحج","العمرة","المحصر",
  "جزاء الصيد","فضائل المدينة","الصوم","صلاة التراويح","فضل ليلة القدر","الاعتكاف","البيوع","السَّلَم",
  "الشفعة","الإجارة","الحوالة","الكفالة","الوكالة","المزارعة","المساقاة","الاستقراض وأداء الديون","الخصومات",
  "اللقطة","المظالم","الشركة","الرهن","العتق","المكاتب","الهبة","الشهادات","الصلح","الشروط","الوصايا",
  "الجهاد والسير","فرض الخمس","الجزية والموادعة","بدء الخلق","أحاديث الأنبياء","المناقب","فضائل أصحاب النبي",
  "مناقب الأنصار","المغازي","تفسير القرآن","فضائل القرآن","النكاح","الطلاق","النفقات","الأطعمة","العقيقة",
  "الذبائح والصيد","الأضاحي","الأشربة","المرضى","الطب","اللباس","الأدب","الاستئذان","الدعوات","الرقاق",
  "القدر","الأيمان والنذور","كفارات الأيمان","الفرائض","الحدود","الديات","استتابة المرتدين","الإكراه","الحيل",
  "تعبير الرؤيا","الفتن","الأحكام","التمني","أخبار الآحاد","الاعتصام بالكتاب والسنة","التوحيد",
];

const MUSLIM_SECTIONS: string[] = [
  "المقدمة","الإيمان","الطهارة","الحيض","الصلاة","المساجد ومواضع الصلاة","صلاة المسافرين وقصرها","الجمعة",
  "صلاة العيدين","صلاة الاستسقاء","الكسوف","الجنائز","الزكاة","الصيام","الاعتكاف","الحج","النكاح","الرضاع",
  "الطلاق","اللعان","العتق","البيوع","المساقاة","الفرائض","الهبات","الوصية","النذر","الأيمان",
  "القسامة والمحاربين والقصاص والديات","الحدود","الأقضية","اللقطة","الجهاد والسير","الإمارة",
  "الصيد والذبائح وما يؤكل من الحيوان","الأضاحي","الأشربة","اللباس والزينة","الآداب","السلام","الألفاظ من الأدب",
  "الشعر","الرؤيا","الفضائل","فضائل الصحابة","البر والصلة والآداب","القدر","العلم","الذكر والدعاء والتوبة والاستغفار",
  "الرقاق","التوبة","صفات المنافقين وأحكامهم","صفة القيامة والجنة والنار","الجنة وصفة نعيمها وأهلها",
  "الفتن وأشراط الساعة","الزهد والرقائق","التفسير",
];

export const HADITH_BOOKS: HadithBook[] = [
  {
    id: "bukhari",
    edition: "ara-bukhari",
    name: "صحيح البخاري",
    short: "البخاري",
    sections: BUKHARI_SECTIONS.map((name, i) => ({ n: i + 1, name })),
  },
  {
    id: "muslim",
    edition: "ara-muslim",
    name: "صحيح مسلم",
    short: "مسلم",
    sections: MUSLIM_SECTIONS.map((name, i) => ({ n: i, name })),
  },
];

export async function getHadithSection(
  edition: string,
  section: number,
): Promise<HadithItem[]> {
  const res = await fetch(`${CDN}/${edition}/sections/${section}.min.json`);
  if (!res.ok) throw new Error(`تعذّر تحميل الأحاديث (${res.status})`);
  const data = (await res.json()) as { hadiths: HadithItem[] };
  return data.hadiths ?? [];
}

export async function getFullEdition(edition: string): Promise<HadithItem[]> {
  const res = await fetch(`${CDN}/${edition}.min.json`);
  if (!res.ok) throw new Error(`تعذّر تحميل فهرس البحث (${res.status})`);
  const data = (await res.json()) as { hadiths: HadithItem[] };
  return data.hadiths ?? [];
}

// تبسيط النص لمطابقة البحث (إزالة التشكيل والهمزات المختلفة).
export function normalizeArabic(s: string) {
  return s
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

export function searchHadiths(items: HadithItem[], query: string, limit = 60) {
  const q = normalizeArabic(query);
  if (q.length < 2) return [];
  const out: HadithItem[] = [];
  for (const h of items) {
    if (normalizeArabic(h.text).includes(q)) {
      out.push(h);
      if (out.length >= limit) break;
    }
  }
  return out;
}
