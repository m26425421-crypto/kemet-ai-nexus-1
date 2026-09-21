import { createFileRoute } from "@tanstack/react-router";
import { useI18n, type Locale } from "@/lib/i18n";
import { useTheme, type Theme } from "@/lib/theme";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Languages, Shield, Info, LogOut } from "lucide-react";
import { useSession } from "@/lib/session";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
});

function Settings() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { signOut } = useSession();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success(locale === "ar" ? "تم تسجيل الخروج" : "Signed out");
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">{t("settings")}</h1>

      <Card className="mb-3 divide-y divide-border overflow-hidden p-0">
        <SettingRow icon={<Languages className="size-4" />} label={t("language")}>
          <ToggleGroup
            value={locale}
            options={[
              { v: "ar" as Locale, label: t("arabic") },
              { v: "en" as Locale, label: t("english") },
            ]}
            onChange={setLocale}
          />
        </SettingRow>
        <SettingRow
          icon={theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          label={t("theme")}
        >
          <ToggleGroup
            value={theme}
            options={[
              { v: "dark" as Theme, label: t("theme_dark") },
              { v: "light" as Theme, label: t("theme_light") },
            ]}
            onChange={setTheme}
          />
        </SettingRow>
      </Card>

      <Card className="mb-3 divide-y divide-border overflow-hidden p-0">
        <div className="p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Shield className="size-4 text-primary" />
            {t("content_policy")}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {locale === "ar"
              ? "يرفض KEMET AI بأدب أي طلب يتعلق بالإباحية أو استغلال الأطفال أو الإرهاب أو خطاب الكراهية أو الاختراق غير المصرح به أو البرمجيات الضارة أو الاحتيال أو انتهاك حقوق النشر."
              : "KEMET AI politely refuses requests involving explicit content, child exploitation, terrorism, hate speech, unauthorized hacking, malware, fraud, or copyright violation."}
          </p>
        </div>
        <div className="p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Info className="size-4 text-accent" />
            {t("about_creator")}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("created_by")} <span className="font-semibold">{t("creator_name")}</span>. {t("creator_bio")}
          </p>
        </div>
        <div className="flex items-center justify-between p-4 text-xs text-muted-foreground">
          <span>{t("version")}</span>
          <span className="font-mono">1.0.0</span>
        </div>
      </Card>

      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={handleSignOut}
      >
        <LogOut className="size-4" />
        {t("signout")}
      </Button>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-secondary p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            value === o.v
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}