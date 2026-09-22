import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "ar" | "en";

type Dict = Record<string, string>;

const AR: Dict = {
  app_name: "KEMET AI",
  app_tagline: "الذكاء الاصطناعي من قلب الحضارة",
  cta_start: "ابدأ الآن",
  cta_signin: "تسجيل الدخول",
  cta_signup: "إنشاء حساب",
  cta_continue: "متابعة",
  or: "أو",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  full_name: "الاسم الكامل",
  forgot_password: "نسيت كلمة المرور؟",
  reset_password: "استعادة كلمة المرور",
  signin_google: "تسجيل الدخول عبر Google",
  signout: "تسجيل الخروج",
  loading: "جارٍ التحميل...",
  thinking: "يفكر...",
  send: "إرسال",
  new_chat: "محادثة جديدة",
  clear: "مسح",
  copy: "نسخ",
  copied: "تم النسخ",
  home: "الرئيسية",
  chat: "محادثة",
  images: "الصور",
  store: "المتجر",
  settings: "الإعدادات",
  profile: "الملف الشخصي",
  credits: "الرصيد",
  daily_bonus: "المكافأة اليومية",
  claim_daily: "استلام +100",
  claim_daily_done: "تم استلامها اليوم",
  language: "اللغة",
  theme: "المظهر",
  theme_dark: "داكن",
  theme_light: "فاتح",
  arabic: "العربية",
  english: "الإنجليزية",
  content_policy: "سياسة المحتوى",
  about_creator: "عن المطوّر",
  version: "الإصدار",
  logout_confirm: "هل تريد تسجيل الخروج؟",
  cancel: "إلغاء",
  confirm: "تأكيد",
  save: "حفظ",
  saved: "تم الحفظ",
  error_generic: "حدث خطأ غير متوقع",
  error_insufficient_credits: "رصيدك غير كافٍ لهذه العملية",
  buy_credits: "شراء الكريدت",
  upgrade: "ترقية",
  subscribe: "اشترك",
  current_plan: "خطتك الحالية",
  plan_free: "مجاني",
  plan_plus: "بلس",
  plan_pro: "برو",
  plan_ultra: "ألترا",
  most_popular: "الأكثر شعبية",
  per_month: "شهرياً",
  chat_placeholder: "اكتب سؤالك...",
  image_placeholder: "اكتب وصف الصورة التي تريد إنشاءها...",
  generate: "توليد",
  regenerate: "إعادة توليد",
  download: "تنزيل",
  quality: "الجودة",
  q_fast: "سريع",
  q_standard: "قياسي",
  q_pro: "احترافي",
  q_realistic: "واقعي",
  q_cinematic: "سينمائي",
  q_ultra: "فائق",
  q_master: "أعلى جودة",
  feature_not_active_title: "البنية جاهزة",
  feature_not_active_body:
    "هذه الميزة مجهزة بالكامل من الناحية التقنية وسيتم تفعيلها قريباً. حتى ذلك الحين، يمكنك استخدام المحادثة الذكية أو توليد الصور.",
  goto_chat: "استخدم المحادثة",
  goto_images: "استخدم الصور",
  welcome_back: "أهلاً بعودتك",
  welcome_new: "مرحباً بك في KEMET AI",
  home_greeting: "ماذا نصنع اليوم؟",
  auth_terms:
    "بالمتابعة أنت توافق على سياسة المحتوى وشروط الاستخدام.",
  invalid_credentials: "بيانات الدخول غير صحيحة",
  email_taken: "هذا البريد مسجّل بالفعل",
  weak_password: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  check_email: "تحقق من بريدك لتأكيد الحساب",
  reset_sent: "تم إرسال رابط إعادة التعيين",
  created_by: "تم تطوير التطبيق بواسطة",
  creator_name: "محمد رزق (أبو حماد)",
  creator_bio:
    "صانع محتوى مصري، قناته على يوتيوب \"جواهر التقوى\". يهتم بالمحتوى الإسلامي، وتصميم المواقع والتطبيقات، والذكاء الاصطناعي.",
  history: "السجل",
  no_history: "لا يوجد سجل بعد",
  cost: "التكلفة",
  credits_short: "كريدت",
};

const EN: Dict = {
  app_name: "KEMET AI",
  app_tagline: "AI from the heart of civilization",
  cta_start: "Get started",
  cta_signin: "Sign in",
  cta_signup: "Create account",
  cta_continue: "Continue",
  or: "or",
  email: "Email",
  password: "Password",
  full_name: "Full name",
  forgot_password: "Forgot password?",
  reset_password: "Reset password",
  signin_google: "Continue with Google",
  signout: "Sign out",
  loading: "Loading...",
  thinking: "Thinking...",
  send: "Send",
  new_chat: "New chat",
  clear: "Clear",
  copy: "Copy",
  copied: "Copied",
  home: "Home",
  chat: "Chat",
  images: "Images",
  store: "Store",
  settings: "Settings",
  profile: "Profile",
  credits: "Credits",
  daily_bonus: "Daily bonus",
  claim_daily: "Claim +10",
  claim_daily_done: "Claimed today",
  language: "Language",
  theme: "Theme",
  theme_dark: "Dark",
  theme_light: "Light",
  arabic: "Arabic",
  english: "English",
  content_policy: "Content policy",
  about_creator: "About the creator",
  version: "Version",
  logout_confirm: "Do you want to sign out?",
  cancel: "Cancel",
  confirm: "Confirm",
  save: "Save",
  saved: "Saved",
  error_generic: "Unexpected error",
  error_insufficient_credits: "Not enough credits for this action",
  buy_credits: "Buy credits",
  upgrade: "Upgrade",
  subscribe: "Subscribe",
  current_plan: "Your current plan",
  plan_free: "Free",
  plan_plus: "Plus",
  plan_pro: "Pro",
  plan_ultra: "Ultra",
  most_popular: "Most popular",
  per_month: "/mo",
  chat_placeholder: "Ask anything...",
  image_placeholder: "Describe the image you want to generate...",
  generate: "Generate",
  regenerate: "Regenerate",
  download: "Download",
  quality: "Quality",
  q_fast: "Fast",
  q_standard: "Standard",
  q_pro: "Pro",
  q_realistic: "Realistic",
  q_cinematic: "Cinematic",
  q_ultra: "Ultra",
  q_master: "Master",
  feature_not_active_title: "Foundation is ready",
  feature_not_active_body:
    "This feature is fully wired on the backend and will be activated soon. In the meantime, use Chat or Image generation.",
  goto_chat: "Open Chat",
  goto_images: "Open Images",
  welcome_back: "Welcome back",
  welcome_new: "Welcome to KEMET AI",
  home_greeting: "What shall we create today?",
  auth_terms: "By continuing you agree to our content policy and terms.",
  invalid_credentials: "Invalid credentials",
  email_taken: "This email is already registered",
  weak_password: "Password must be at least 6 characters",
  check_email: "Check your email to confirm your account",
  reset_sent: "Reset link sent",
  created_by: "App developed by",
  creator_name: "Mohamed Rezk (Abu Hammad)",
  creator_bio:
    "Egyptian content creator, YouTube channel \"Jawaher Al-Taqwa\". Passionate about Islamic content, web/app design, and AI.",
  history: "History",
  no_history: "No history yet",
  cost: "Cost",
  credits_short: "cr",
};

const DICTS: Record<Locale, Dict> = { ar: AR, en: EN };

interface I18nCtx {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: keyof typeof AR | string) => string;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nCtx | null>(null);

const STORAGE_KEY = "kemet.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "ar" || stored === "en") setLocaleState(stored);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo<I18nCtx>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: (key) => DICTS[locale][key as string] ?? DICTS.en[key as string] ?? (key as string),
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}