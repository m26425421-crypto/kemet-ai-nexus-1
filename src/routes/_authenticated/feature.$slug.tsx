import { createFileRoute, Link } from "@tanstack/react-router";
import { FEATURES } from "@/lib/features";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, MessageSquare, ImageIcon, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/feature/$slug")({
  component: FeaturePage,
});

function FeaturePage() {
  const { slug } = Route.useParams();
  const { t, locale } = useI18n();
  const feature = FEATURES.find((f) => f.route === `/feature/${slug}`);

  const name = feature ? (locale === "ar" ? feature.nameAr : feature.nameEn) : slug;
  const Icon = feature?.icon ?? Wrench;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="size-8" />
        </div>
        <h1 className="text-2xl font-bold">{name}</h1>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card p-6 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary">
          <Wrench className="size-3" />
          {t("feature_not_active_title")}
        </div>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {t("feature_not_active_body")}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/chat" className="flex-1">
            <Button variant="default" className="w-full gap-2">
              <MessageSquare className="size-4" />
              {t("goto_chat")}
            </Button>
          </Link>
          <Link to="/images" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <ImageIcon className="size-4" />
              {t("goto_images")}
            </Button>
          </Link>
        </div>
      </Card>

      <div className="mt-6 text-center">
        <Link to="/home" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-3" />
          {locale === "ar" ? "العودة للرئيسية" : "Back home"}
        </Link>
      </div>
    </div>
  );
}