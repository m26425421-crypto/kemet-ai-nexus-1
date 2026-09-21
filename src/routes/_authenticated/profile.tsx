import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Settings as SettingsIcon, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, listCreditTransactions } from "@/lib/credits.functions";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
});

function Profile() {
  const { t, locale } = useI18n();
  const { user } = useSession();
  const fetchProfile = useServerFn(getProfile);
  const listTx = useServerFn(listCreditTransactions);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(),
    enabled: !!user,
  });

  const { data: txs = [] } = useQuery({
    queryKey: ["credit-tx"],
    queryFn: () => listTx(),
  });

  const reasonLabel = (r: string) => {
    const map: Record<string, string> = {
      signup_bonus: locale === "ar" ? "مكافأة التسجيل" : "Signup bonus",
      daily_bonus: locale === "ar" ? "مكافأة يومية" : "Daily bonus",
    };
    if (map[r]) return map[r];
    if (r.startsWith("image_")) return locale === "ar" ? "توليد صورة" : "Image generation";
    if (r.startsWith("refund_")) return locale === "ar" ? "استرداد" : "Refund";
    return r;
  };

  const initials = (profile?.full_name || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Card className="mb-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-lg font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="truncate text-lg font-bold">
              {profile?.full_name ?? user?.email?.split("@")[0]}
            </div>
            <div className="truncate text-xs text-muted-foreground" dir="ltr">
              {user?.email}
            </div>
          </div>
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <SettingsIcon className="size-4" />
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="mb-4 flex items-center justify-between gap-3 border-primary/40 bg-gradient-to-br from-primary/10 to-card p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/20 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("credits")}</div>
            <div className="text-2xl font-black text-primary tabular-nums">
              {profile?.credits ?? 0}
            </div>
          </div>
        </div>
        <div className="text-end">
          <div className="text-xs text-muted-foreground">{t("current_plan")}</div>
          <div className="flex items-center gap-1 text-sm font-bold">
            <Crown className="size-4 text-primary" />
            {t(`plan_${profile?.plan ?? "free"}`)}
          </div>
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("history")}</h2>
      {txs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("no_history")}
        </p>
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {txs.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3">
              <div>
                <div className="text-sm font-medium">{reasonLabel(tx.reason)}</div>
                <div className="text-[10px] text-muted-foreground">
                  {format(new Date(tx.created_at), "yyyy-MM-dd HH:mm")}
                </div>
              </div>
              <div
                className={
                  tx.amount > 0
                    ? "text-sm font-bold text-emerald-500 tabular-nums"
                    : "text-sm font-bold text-destructive tabular-nums"
                }
              >
                {tx.amount > 0 ? "+" : ""}
                {tx.amount}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}