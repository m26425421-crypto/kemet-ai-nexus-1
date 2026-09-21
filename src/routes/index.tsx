import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { LogoWordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Image as ImageIcon,
  Sparkles,
  Moon,
  Shield,
} from "lucide-react";
import heroBg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/home", replace: true });
  }, [loading, session, navigate]);

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />

      <div className="relative mx-auto flex min-h-svh max-w-3xl flex-col items-center px-6 py-8">
        <div className="flex w-full items-center justify-between">
          <LogoWordmark />
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              {t("cta_signin")}
            </Button>
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            {t("app_tagline")}
          </div>
          <h1 className="mb-4 text-balance text-5xl font-black tracking-tight sm:text-6xl">
            <span className="text-gradient-gold">KEMET</span>{" "}
            <span className="text-turquoise">AI</span>
          </h1>
          <p className="mb-10 max-w-md text-balance text-base text-muted-foreground sm:text-lg">
            {locale === "ar"
              ? "مساعدك الذكي بالعربية: محادثة، توليد صور، ترجمة، برمجة، محتوى إسلامي — كل ذلك في مكان واحد."
              : "Your Arabic-first AI companion: chat, image generation, translation, coding, Islamic content — all in one place."}
          </p>

          <div className="flex w-full max-w-xs flex-col gap-3">
            <Link to="/auth">
              <Button size="lg" className="h-12 w-full gap-2 text-base font-semibold">
                {t("cta_start")}
                <Arrow className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-3 text-center">
            <FeatureBadge icon={MessageSquare} label={t("chat")} />
            <FeatureBadge icon={ImageIcon} label={t("images")} />
            <FeatureBadge icon={Moon} label={locale === "ar" ? "إسلامي" : "Islamic"} />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="size-3.5" />
          <span>{locale === "ar" ? "بياناتك محمية ومشفّرة" : "Your data is safe & encrypted"}</span>
        </div>
      </div>
    </div>
  );
}

function FeatureBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/50 p-3 backdrop-blur">
      <Icon className="size-5 text-primary" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
