import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, MessageSquare, ImageIcon, Store, User, Shield } from "lucide-react";
import { LogoWordmark } from "@/components/logo";
import { useSettings } from "@/lib/settings";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun, Languages } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/credits.functions";
import { Sparkles, Lock } from "lucide-react";
import { FEATURES } from "@/lib/features";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const { session } = useSession();
  const navigate = useNavigate();
  const settings = useSettings();
  const location = useLocation();

  const fetchProfile = useServerFn(getProfile);
  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: () => fetchProfile(),
    enabled: !!session?.user,
    staleTime: 30_000,
  });

  const currentFeature = FEATURES.find(
    (f) => location.pathname === f.route || location.pathname.startsWith(`${f.route}/`),
  );
  const blocked =
    (!!currentFeature && !settings.bool(`features.${currentFeature.id}`, true)) ||
    (location.pathname.startsWith("/store") && !settings.bool("features.store", true)) ||
    (location.pathname.startsWith("/marketplace") && !settings.bool("features.marketplace", true));

  const tabs = [
    { to: "/home", icon: Home, label: t("home"), key: null as string | null },
    { to: "/chat", icon: MessageSquare, label: t("chat"), key: "features.chat" },
    { to: "/images", icon: ImageIcon, label: t("images"), key: "features.images" },
    { to: "/store", icon: Store, label: t("store"), key: "features.store" },
    { to: "/profile", icon: User, label: t("profile"), key: null as string | null },
  ].filter((tab) => !tab.key || settings.bool(tab.key, true));

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/home">
            <LogoWordmark />
          </Link>
          <div className="flex items-center gap-1.5">
            {profile?.roles?.includes("admin") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: "/admin" })}
                aria-label="admin"
                className="text-primary"
              >
                <Shield className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/store" })}
              className="gap-1.5 rounded-full bg-primary/10 px-3 text-primary hover:bg-primary/20"
            >
              <Sparkles className="size-4" />
              <span className="font-semibold tabular-nums">
                {profile?.isDeveloper ? "∞" : (profile?.credits ?? 0)}
              </span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              aria-label="language"
            >
              <Languages className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24">
        {blocked ? (
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Lock className="size-6" />
            </div>
            <h2 className="mb-2 text-lg font-bold">
              {locale === "ar" ? "هذا القسم غير متاح حالياً" : "This section is currently unavailable"}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {locale === "ar"
                ? "تم إيقاف هذا القسم مؤقتاً من لوحة التحكم."
                : "This section has been turned off from the control panel."}
            </p>
            <Button onClick={() => navigate({ to: "/home" })}>
              {locale === "ar" ? "العودة للرئيسية" : "Back home"}
            </Button>
          </div>
        ) : (
          children
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-stretch justify-between px-2 py-1.5">
          {tabs.map((tab) => {
            const active =
              location.pathname === tab.to ||
              (tab.to !== "/home" && location.pathname.startsWith(tab.to));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "scale-110")} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}