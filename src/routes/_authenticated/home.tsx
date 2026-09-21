import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { FEATURES } from "@/lib/features";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { claimDailyBonus, getProfile } from "@/lib/credits.functions";
import { toast } from "sonner";
import { Gift, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/_authenticated/home")({
  component: Home,
});

function Home() {
  const { t, locale } = useI18n();
  const { user } = useSession();
  const navigate = useNavigate();
  const settings = useSettings();
  const visibleFeatures = FEATURES.filter((f) => settings.bool(`features.${f.id}`, true));
  const dailyBonus = settings.num("rewards.daily_bonus", 10);

  const fetchProfile = useServerFn(getProfile);
  const claim = useServerFn(claimDailyBonus);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(),
    enabled: !!user,
  });

  const claimMut = useMutation({
    mutationFn: () => claim(),
    onSuccess: (res) => {
      if (res.newBalance === -1) {
        toast.info(t("claim_daily_done"));
      } else {
        toast.success(`+${dailyBonus} ${t("credits_short")}`);
        qc.invalidateQueries({ queryKey: ["profile"] });
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t("error_generic")),
  });

  const claimedToday =
    profile?.last_daily_bonus_at &&
    new Date(profile.last_daily_bonus_at).toISOString().slice(0, 10) ===
      new Date().toISOString().slice(0, 10);

  const greetName = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {locale === "ar" ? "مرحباً بك،" : "Welcome,"}{" "}
            <span className="font-semibold text-foreground">{greetName}</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{t("home_greeting")}</h1>
        </div>
      </div>

      {/* Daily bonus */}
      <Card className="mb-6 flex items-center justify-between gap-3 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-4 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/20 text-primary">
            <Gift className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">{t("daily_bonus")}</div>
            <div className="text-xs text-muted-foreground">
              {locale === "ar" ? `${dailyBonus} كريدت هدية كل يوم` : `${dailyBonus} free credits every day`}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => claimMut.mutate()}
          disabled={claimMut.isPending || !!claimedToday}
          className="font-semibold"
        >
          {claimedToday ? t("claim_daily_done") : t("claim_daily")}
        </Button>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        {locale === "ar" ? "الأدوات" : "Tools"}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {visibleFeatures.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.id}
              to={f.route}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-br",
                  f.gradient,
                )}
              />
              <div className="relative">
                <div className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="mb-0.5 flex items-center gap-1.5 text-sm font-semibold">
                  {locale === "ar" ? f.nameAr : f.nameEn}
                  {!f.active && <Lock className="size-3 text-muted-foreground" />}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {locale === "ar" ? f.descAr : f.descEn}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {settings.bool("features.store", true) && (
      <Card
        onClick={() => navigate({ to: "/store" })}
        className="mt-6 flex cursor-pointer items-center justify-between gap-3 border-accent/40 bg-gradient-to-br from-accent/10 to-card p-4 transition hover:shadow-glow"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-accent/20 text-accent">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">{t("upgrade")}</div>
            <div className="text-xs text-muted-foreground">
              {locale === "ar"
                ? "اكتشف خطط KEMET Plus وPro وUltra"
                : "Explore KEMET Plus, Pro & Ultra"}
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm">
          {t("store")}
        </Button>
      </Card>
      )}

      {settings.bool("features.marketplace", true) && (
      <Card
        onClick={() => navigate({ to: "/marketplace" })}
        className="mt-3 flex cursor-pointer items-center justify-between gap-3 border-primary/40 bg-gradient-to-br from-primary/10 to-card p-4 transition hover:shadow-glow"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/20 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">
              {locale === "ar" ? "متجر KEMET العالمي" : "KEMET Marketplace"}
            </div>
            <div className="text-xs text-muted-foreground">
              {locale === "ar" ? "اشترِ أو بع منتجات رقمية بالكريدت" : "Buy and sell digital products with credits"}
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm">
          {locale === "ar" ? "دخول" : "Enter"}
        </Button>
      </Card>
      )}
    </div>
  );
}