// مصدر النص القرآني والتلاوات: AlQuran Cloud API (رسم عثماني) + شبكة islamic.network للصوتيات.
// كل الطلبات للقراءة فقط ولا تحتاج مفاتيح.

const API = "https://api.alquran.cloud/v1";
const AUDIO_CDN = "https://cdn.islamic.network/quran/audio/128";

export type SurahMeta = {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type Ayah = {
  number: number; // الرقم العام في المصحف (يُستخدم للصوت)
  numberInSurah: number;
  text: string;
  tafsir?: string;
};

export type Reciter = { id: string; name: string };

export type SurahReciter = {
  id: string;
  name: string;
  server: string;
};

// تسجيلات سور كاملة موثقة من إذاعات القرآن الكريم (MP3Quran).
// هذه القائمة منفصلة عن تلاوات آية-آية لأن لكل مصدر معرّفات مختلفة.
export const SURAH_RECITERS: SurahReciter[] = [
  { id: "islam-sobhi", name: "إسلام صبحي", server: "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/" },
  { id: "yasser-dosari", name: "ياسر الدوسري", server: "https://server11.mp3quran.net/yasser/" },
  { id: "mohamed-luhaidan", name: "محمد اللحيدان", server: "https://server8.mp3quran.net/lhdan/" },
  { id: "fares-abbad", name: "فارس عباد", server: "https://server8.mp3quran.net/frs_a/" },
  { id: "khalid-jalil", name: "خالد الجليل", server: "https://server10.mp3quran.net/jleel/" },
  { id: "mishary-afasy", name: "مشاري راشد العفاسي", server: "https://server8.mp3quran.net/afs/" },
  { id: "abdulbasit", name: "عبد الباسط عبد الصمد", server: "https://server7.mp3quran.net/basit/" },
  { id: "minshawi", name: "محمد صديق المنشاوي", server: "https://server10.mp3quran.net/minsh/" },
  { id: "husary", name: "محمود خليل الحصري", server: "https://server13.mp3quran.net/husr/" },
  { id: "sudais", name: "عبد الرحمن السديس", server: "https://server11.mp3quran.net/sds/" },
  { id: "maher", name: "ماهر المعيقلي", server: "https://server12.mp3quran.net/maher/" },
  { id: "shuraim", name: "سعود الشريم", server: "https://server7.mp3quran.net/shur/" },
  { id: "ajamy", name: "أحمد بن علي العجمي", server: "https://server10.mp3quran.net/ajm/" },
];

// أشهر القرّاء المتوفرين بتلاوة آية-آية.
export const RECITERS: Reciter[] = [
  { id: "ar.alafasy", name: "مشاري راشد العفاسي" },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد (مرتّل)" },
  { id: "ar.abdulsamad", name: "عبد الباسط عبد الصمد (مجوّد)" },
  { id: "ar.husary", name: "محمود خليل الحصري" },
  { id: "ar.husarymujawwad", name: "محمود خليل الحصري (مجوّد)" },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي" },
  { id: "ar.minshawimujawwad", name: "محمد صديق المنشاوي (مجوّد)" },
  { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس" },
  { id: "ar.saoodshuraym", name: "سعود الشريم" },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي" },
  { id: "ar.ahmedajamy", name: "أحمد بن علي العجمي" },
  { id: "ar.shaatree", name: "أبو بكر الشاطري" },
  { id: "ar.hudhaify", name: "علي الحذيفي" },
  { id: "ar.hanirifai", name: "هاني الرفاعي" },
  { id: "ar.muhammadayyoub", name: "محمد أيوب" },
  { id: "ar.muhammadjibreel", name: "محمد جبريل" },
  { id: "ar.abdullahbasfar", name: "عبد الله بصفر" },
  { id: "ar.ibrahimakhbar", name: "إبراهيم الأخضر" },
];

export const TAFSIRS = [
  { id: "ar.muyassar", name: "التفسير الميسر — مجمع الملك فهد" },
  { id: "ar.jalalayn", name: "تفسير الجلالين" },
];

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`تعذّر الاتصال بمصدر القرآن (${res.status})`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

export function getSurahs() {
  return json<SurahMeta[]>(`${API}/surah`);
}

export async function getSurah(
  number: number,
  tafsirEdition: string | null,
): Promise<{ meta: SurahMeta; ayahs: Ayah[] }> {
  const main = await json<SurahMeta & { ayahs: Ayah[] }>(
    `${API}/surah/${number}/quran-uthmani`,
  );
  let tafsirAyahs: Ayah[] = [];
  if (tafsirEdition) {
    try {
      const t = await json<{ ayahs: Ayah[] }>(`${API}/surah/${number}/${tafsirEdition}`);
      tafsirAyahs = t.ayahs;
    } catch {
      tafsirAyahs = [];
    }
  }
  const ayahs = main.ayahs.map((a, i) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text.replace(/^\uFEFF/, ""),
    tafsir: tafsirAyahs[i]?.text,
  }));
  return {
    meta: {
      number: main.number,
      name: main.name,
      englishName: main.englishName,
      numberOfAyahs: main.numberOfAyahs,
      revelationType: main.revelationType,
    },
    ayahs,
  };
}

export function ayahAudioUrl(reciter: string, globalAyahNumber: number) {
  return `${AUDIO_CDN}/${reciter}/${globalAyahNumber}.mp3`;
}

export function surahAudioUrl(server: string, surahNumber: number) {
  return `${server}${String(surahNumber).padStart(3, "0")}.mp3`;
}

export async function getQuranPage(page: number): Promise<Ayah[]> {
  const safePage = Math.min(604, Math.max(1, Math.round(page)));
  const data = await json<{ ayahs: Ayah[] }>(`${API}/page/${safePage}/quran-uthmani`);
  return data.ayahs.map((a) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text.replace(/^\uFEFF/, ""),
  }));
}

export type SearchMatch = {
  number: number;
  text: string;
  numberInSurah: number;
  surah: { number: number; name: string; englishName: string };
};

export async function searchQuran(query: string): Promise<SearchMatch[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await json<{ count: number; matches: SearchMatch[] }>(
    `${API}/search/${encodeURIComponent(q)}/all/quran-uthmani`,
  );
  return data?.matches ?? [];
}
