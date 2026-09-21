import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { SUBSCRIPTION_PLANS } from "@/lib/features";
import { useSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/store")({
  component: Store,
});

const CREDIT_PACKS = [
  { credits: 500, priceUSD: 5 },
  { credits: 1200, priceUSD: 10 },
  { credits: 3000, priceUSD: 20 },
  { credits: 7000, priceUSD: 40 },
];

function Store() {
  const { t, locale } = useI18n();
  const settings = useSettings();

  function notReady() {
    toast.info(
      locale === "ar"
        ? "معالج الدفع سيتم تفعيله قريباً. البنية جاهزة للربط."
        : "Payment processor coming soon. Infrastructure ready.",
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">{t("store")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {locale === "ar"
          ? "اختر خطة أو باقة كريدت تناسبك"
          : "Choose a plan or a credit pack"}
      </p>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        {locale === "ar" ? "الاشتراكات الشهرية" : "Monthly subscriptions"}
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((base) => {
          const p = {
            ...base,
            priceUSD: settings.num(`plans.${base.id}.price`, base.priceUSD),
            credits: settings.num(`plans.${base.id}.credits`, base.credits),
          };
          const Icon = p.id === "plus" ? Sparkles : p.id === "pro" ? Zap : Crown;
          return (
            <Card
              key={p.id}
              className={cn(
                "relative flex flex-col gap-4 border-border/60 p-5",
                p.highlight && "border-primary/60 bg-gradient-to-br from-primary/10 to-card shadow-glow",
              )}
            >
              {p.highlight && (
                <div className="absolute -top-2.5 start-4 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {t("most_popular")}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Icon className="size-5 text-primary" />
                <h3 className="text-lg font-bold">KEMET {p.id === "plus" ? "Plus" : p.id === "pro" ? "Pro" : "Ultra"}</h3>
              </div>
              <div>
                <span className="text-3xl font-black">${p.priceUSD}</span>
                <span className="text-sm text-muted-foreground">{t("per_month")}</span>
              </div>
              <div className="text-sm font-semibold text-primary">
                {p.credits.toLocaleString()} {t("credits_short")}
              </div>
              <ul className="space-y-1.5 text-sm">
                {(locale === "ar" ? p.featuresAr : p.featuresEn).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={notReady}
                variant={p.highlight ? "default" : "outline"}
                className="mt-auto h-10"
              >
                {t("subscribe")}
              </Button>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-muted-foreground">
        {locale === "ar" ? "باقات الكريدت" : "Credit packs"}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CREDIT_PACKS.map((pk) => (
          <Card key={pk.credits} className="p-4">
            <div className="text-xs text-muted-foreground">{t("credits")}</div>
            <div className="text-2xl font-black text-primary">
              {pk.credits.toLocaleString()}
            </div>
            <div className="mt-1 text-lg font-bold">${pk.priceUSD}</div>
            <Button onClick={notReady} size="sm" variant="outline" className="mt-3 w-full">
              {t("buy_credits")}
            </Button>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {locale === "ar"
          ? "الدفع عبر Google Play وPayPal وVisa وMastercard سيتم تفعيله عند نشر التطبيق."
          : "Payment via Google Play, PayPal, Visa, and Mastercard will be enabled on release."}
      </p>
    </div>
  );
}