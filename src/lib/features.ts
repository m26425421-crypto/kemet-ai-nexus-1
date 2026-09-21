import {
  MessageSquare,
  ImageIcon,
  Video,
  FileText,
  Code2,
  GraduationCap,
  Languages,
  ScanEye,
  Mic,
  Volume2,
  Clapperboard,
  MoonStar,
  type LucideIcon,
} from "lucide-react";

export type FeatureId =
  | "chat"
  | "images"
  | "videos"
  | "summarizer"
  | "programming"
  | "study"
  | "translation"
  | "vision"
  | "stt"
  | "tts"
  | "creator"
  | "islamic";

export interface Feature {
  id: FeatureId;
  route: string;
  icon: LucideIcon;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  active: boolean;
  gradient: string;
}

export const FEATURES: Feature[] = [
  {
    id: "chat",
    route: "/chat",
    icon: MessageSquare,
    nameAr: "محادثة ذكية",
    nameEn: "Chat AI",
    descAr: "محادثة نصية مجانية بلا حدود",
    descEn: "Unlimited free text chat",
    active: true,
    gradient: "from-amber-500/20 to-yellow-500/20",
  },
  {
    id: "images",
    route: "/images",
    icon: ImageIcon,
    nameAr: "توليد الصور",
    nameEn: "AI Images",
    descAr: "من نصك إلى صورة عالية الجودة",
    descEn: "From text to stunning imagery",
    active: true,
    gradient: "from-cyan-500/20 to-teal-500/20",
  },
  {
    id: "videos",
    route: "/video-studio",
    icon: Video,
    nameAr: "فيديوهات AI",
    nameEn: "AI Videos",
    descAr: "فيديو حقيقي من نص أو صورة عبر Fal.ai",
    descEn: "Real video from text or image via Fal.ai",
    active: true,
    gradient: "from-rose-500/20 to-red-500/20",
  },
  {
    id: "summarizer",
    route: "/feature/summarizer",
    icon: FileText,
    nameAr: "تلخيص الملفات",
    nameEn: "File Summarizer",
    descAr: "PDF ونصوص وكتب طويلة",
    descEn: "PDF, docs and long texts",
    active: true,
    gradient: "from-emerald-500/20 to-green-500/20",
  },
  {
    id: "programming",
    route: "/feature/programming",
    icon: Code2,
    nameAr: "البرمجة",
    nameEn: "Programming",
    descAr: "شرح، إصلاح، وكتابة الكود",
    descEn: "Explain, fix, and write code",
    active: true,
    gradient: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: "study",
    route: "/feature/study",
    icon: GraduationCap,
    nameAr: "المذاكرة",
    nameEn: "Study Assistant",
    descAr: "شرح وامتحانات وتلخيص",
    descEn: "Explain, quiz, and summarize",
    active: true,
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    id: "translation",
    route: "/feature/translation",
    icon: Languages,
    nameAr: "الترجمة",
    nameEn: "Translation",
    descAr: "ترجمة دقيقة بين اللغات",
    descEn: "Accurate multi-language translation",
    active: true,
    gradient: "from-sky-500/20 to-blue-500/20",
  },
  {
    id: "vision",
    route: "/feature/vision",
    icon: ScanEye,
    nameAr: "تحليل الصور",
    nameEn: "Image Analysis",
    descAr: "افهم أي صورة بذكاء",
    descEn: "Understand any image",
    active: true,
    gradient: "from-fuchsia-500/20 to-pink-500/20",
  },
  {
    id: "stt",
    route: "/feature/stt",
    icon: Mic,
    nameAr: "الصوت إلى نص",
    nameEn: "Speech to Text",
    descAr: "تحويل تسجيلاتك إلى نص",
    descEn: "Transcribe your recordings",
    active: true,
    gradient: "from-orange-500/20 to-amber-500/20",
  },
  {
    id: "tts",
    route: "/feature/tts",
    icon: Volume2,
    nameAr: "النص إلى صوت",
    nameEn: "Text to Speech",
    descAr: "صوت طبيعي من نصك",
    descEn: "Natural voice from your text",
    active: true,
    gradient: "from-lime-500/20 to-emerald-500/20",
  },
  {
    id: "creator",
    route: "/feature/creator",
    icon: Clapperboard,
    nameAr: "استوديو صانع المحتوى",
    nameEn: "Creator Studio",
    descAr: "عناوين، Thumbnails، سكربتات",
    descEn: "Titles, thumbnails, scripts",
    active: true,
    gradient: "from-red-500/20 to-rose-500/20",
  },
  {
    id: "islamic",
    route: "/feature/islamic",
    icon: MoonStar,
    nameAr: "الاستوديو الإسلامي",
    nameEn: "Islamic Studio",
    descAr: "منشورات، بطاقات، وقرآن",
    descEn: "Posts, cards, and Quran",
    active: true,
    gradient: "from-teal-500/20 to-cyan-500/20",
  },
];

export const IMAGE_QUALITIES = [
  { id: "fast", cost: 20, model: "openai/gpt-image-1-mini", quality: "low" as const },
  { id: "standard", cost: 35, model: "openai/gpt-image-1-mini", quality: "medium" as const },
  { id: "pro", cost: 60, model: "openai/gpt-image-2", quality: "low" as const },
  { id: "realistic", cost: 90, model: "openai/gpt-image-2", quality: "medium" as const },
  { id: "cinematic", cost: 120, model: "openai/gpt-image-2", quality: "medium" as const },
  { id: "ultra", cost: 180, model: "openai/gpt-image-2", quality: "high" as const },
  { id: "master", cost: 300, model: "openai/gpt-image-2", quality: "high" as const },
] as const;

export type ImageQualityId = (typeof IMAGE_QUALITIES)[number]["id"];

export const IMAGE_ASPECTS = [
  { id: "square", size: "1024x1024", labelAr: "مربع 1:1", labelEn: "Square 1:1" },
  { id: "landscape", size: "1536x1024", labelAr: "أفقي 16:9", labelEn: "Landscape 16:9" },
  { id: "portrait", size: "1024x1536", labelAr: "عمودي 9:16", labelEn: "Portrait 9:16" },
] as const;
export type ImageAspectId = (typeof IMAGE_ASPECTS)[number]["id"];

export const VIDEO_ASPECTS = [
  { id: "landscape", labelAr: "أفقي 16:9 (YouTube)", labelEn: "Landscape 16:9" },
  { id: "portrait", labelAr: "عمودي 9:16 (Reels/TikTok)", labelEn: "Portrait 9:16" },
  { id: "square", labelAr: "مربع 1:1 (Instagram)", labelEn: "Square 1:1" },
] as const;
export type VideoAspectId = (typeof VIDEO_ASPECTS)[number]["id"];

export const SUBSCRIPTION_PLANS = [
  {
    id: "plus" as const,
    priceUSD: 10,
    credits: 1500,
    featuresAr: [
      "1500 كريدت شهرياً",
      "إزالة العلامة المائية",
      "بدون إعلانات",
      "حفظ سحابي",
      "جودة أعلى",
    ],
    featuresEn: [
      "1500 credits / month",
      "No watermark",
      "Ad-free",
      "Cloud sync",
      "Higher quality",
    ],
    highlight: false,
  },
  {
    id: "pro" as const,
    priceUSD: 20,
    credits: 3000,
    featuresAr: [
      "3000 كريدت شهرياً",
      "جميع مزايا Plus",
      "أحدث النماذج",
      "أولوية في الخوادم",
    ],
    featuresEn: [
      "3000 credits / month",
      "All Plus features",
      "Latest models",
      "Priority servers",
    ],
    highlight: true,
  },
  {
    id: "ultra" as const,
    priceUSD: 40,
    credits: 6000,
    featuresAr: [
      "6000 كريدت شهرياً",
      "جميع مزايا Pro",
      "أعلى سرعة",
      "أعلى جودة",
      "وصول مبكر للميزات الجديدة",
    ],
    featuresEn: [
      "6000 credits / month",
      "All Pro features",
      "Top speed",
      "Top quality",
      "Early access to new features",
    ],
    highlight: false,
  },
];