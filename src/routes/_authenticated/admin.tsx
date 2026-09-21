import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shield, Users, Coins, ToggleRight, Search, Ban, CheckCircle2, Save, Loader2, Store, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfile } from "@/lib/credits.functions";
import {
  adminStats,
  adminListUsers,
  adminSetCredits,
  adminSetPlan,
  adminSetBanned,
  adminListSettings,
  adminSetSetting,
  adminMpPendingProducts,
  adminMpSetStatus,
  adminMpPendingPayouts,
  adminMpSetPayout,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const profile = await getProfile();
    if (!profile.roles.includes("admin")) {
      throw redirect({ to: "/home" });
    }
  },
  component: AdminPage,
});

type Tab = "overview" | "users" | "settings" | "features" | "marketplace" | "payouts";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "نظرة عامة", icon: Shield },
    { id: "users", label: "المستخدمون", icon: Users },
    { id: "settings", label: "الأسعار والمكافآت", icon: Coins },
    { id: "features", label: "الميزات", icon: ToggleRight },
    { id: "marketplace", label: "المتجر", icon: Store },
    { id: "payouts", label: "السحوبات", icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Shield className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">لوحة تحكم المطور</h1>
          <p className="text-xs text-muted-foreground">
            جميع الإعدادات تُطبَّق فورياً بدون إعادة نشر التطبيق
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-secondary/50 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition " +
                (active ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "settings" && <SettingsTab filter="cost." title="أسعار الأدوات (كريدت)" />}
      {tab === "features" && <FeaturesTab />}
      {tab === "marketplace" && <MarketplaceModTab />}
      {tab === "payouts" && <PayoutsTab />}
    </div>
  );
}

function MarketplaceModTab() {
  const qc = useQueryClient();
  const fetchPending = useServerFn(adminMpPendingProducts);
  const setStatus = useServerFn(adminMpSetStatus);
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["admin", "mp-pending"],
    queryFn: () => fetchPending(),
  });
  const m = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" }) => setStatus({ data: v }),
    onSuccess: (_d, v) => { toast.success(v.status === "approved" ? "تمت الموافقة" : "تم الرفض"); qc.invalidateQueries({ queryKey: ["admin", "mp-pending"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>;
  if (pending.length === 0) return <div className="py-8 text-center text-sm text-muted-foreground">لا توجد منتجات بانتظار المراجعة</div>;
  return (
    <div className="space-y-2">
      {pending.map((p) => (
        <Card key={p.id} className="p-3">
          <div className="mb-2">
            <div className="text-sm font-semibold">{p.title}</div>
            <div className="text-[10px] text-muted-foreground">{p.category} · {p.price_credits} كريدت · {new Date(p.created_at).toLocaleDateString("ar-EG")}</div>
          </div>
          <p className="mb-2 line-clamp-3 text-xs text-muted-foreground">{p.description}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => m.mutate({ id: p.id, status: "approved" })}>موافقة</Button>
            <Button size="sm" variant="destructive" onClick={() => m.mutate({ id: p.id, status: "rejected" })}>رفض</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function PayoutsTab() {
  const qc = useQueryClient();
  const fetch = useServerFn(adminMpPendingPayouts);
  const setPayout = useServerFn(adminMpSetPayout);
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["admin", "mp-payouts"],
    queryFn: () => fetch(),
  });
  const m = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" | "paid" }) => setPayout({ data: v }),
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["admin", "mp-payouts"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>;
  if (payouts.length === 0) return <div className="py-8 text-center text-sm text-muted-foreground">لا توجد طلبات سحب</div>;
  return (
    <div className="space-y-2">
      {payouts.map((p) => (
        <Card key={p.id} className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{p.amount_credits} كريدت</div>
              <div className="text-[10px] text-muted-foreground">{p.method} · {p.status} · {new Date(p.created_at).toLocaleDateString("ar-EG")}</div>
            </div>
          </div>
          <pre className="mb-2 max-h-24 overflow-auto rounded bg-secondary/40 p-2 text-[10px]">{JSON.stringify(p.details, null, 2)}</pre>
          <div className="flex flex-wrap gap-2">
            {p.status === "pending" && <Button size="sm" onClick={() => m.mutate({ id: p.id, status: "approved" })}>موافقة</Button>}
            {p.status !== "paid" && <Button size="sm" variant="outline" onClick={() => m.mutate({ id: p.id, status: "paid" })}>تم الدفع</Button>}
            {p.status !== "rejected" && <Button size="sm" variant="destructive" onClick={() => m.mutate({ id: p.id, status: "rejected" })}>رفض</Button>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function OverviewTab() {
  const fetchStats = useServerFn(adminStats);
  const { data } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => fetchStats() });
  const s = (data ?? {}) as Record<string, number | Record<string, number>>;
  const cards = [
    { label: "إجمالي المستخدمين", value: s.total_users ?? 0 },
    { label: "تسجيلات اليوم", value: s.signups_today ?? 0 },
    { label: "نشطون اليوم", value: s.active_today ?? 0 },
    { label: "محظورون", value: s.banned_users ?? 0 },
    { label: "صور مُنشأة", value: s.total_images ?? 0 },
    { label: "رسائل محادثة", value: s.total_messages ?? 0 },
    { label: "كريدت مستهلك اليوم", value: s.credits_spent_today ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="text-xs text-muted-foreground">{c.label}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {typeof c.value === "number" ? c.value.toLocaleString() : String(c.value)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const fetchUsers = useServerFn(adminListUsers);
  const setCredits = useServerFn(adminSetCredits);
  const setPlan = useServerFn(adminSetPlan);
  const setBanned = useServerFn(adminSetBanned);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => fetchUsers({ data: { search, limit: 100, offset: 0 } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const mCredits = useMutation({
    mutationFn: (v: { user_id: string; credits: number }) => setCredits({ data: v }),
    onSuccess: () => { toast.success("تم تحديث الرصيد"); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const mPlan = useMutation({
    mutationFn: (v: { user_id: string; plan: "free" | "plus" | "pro" | "ultra" }) => setPlan({ data: v }),
    onSuccess: () => { toast.success("تم تغيير الخطة"); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const mBan = useMutation({
    mutationFn: (v: { user_id: string; banned: boolean }) => setBanned({ data: v }),
    onSuccess: (_d, v) => { toast.success(v.banned ? "تم الحظر" : "تم فك الحظر"); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالبريد أو الاسم..."
          className="ps-9"
        />
      </div>
      {isLoading && <div className="py-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>}
      <div className="space-y-2">
        {users.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            onSetCredits={(c) => mCredits.mutate({ user_id: u.id, credits: c })}
            onSetPlan={(p) => mPlan.mutate({ user_id: u.id, plan: p })}
            onToggleBan={() => mBan.mutate({ user_id: u.id, banned: !u.banned })}
          />
        ))}
        {!isLoading && users.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">لا يوجد مستخدمون</div>
        )}
      </div>
    </div>
  );
}

function UserRow({
  user,
  onSetCredits,
  onSetPlan,
  onToggleBan,
}: {
  user: { id: string; email: string; full_name: string | null; credits: number; plan: string; banned: boolean; roles: string[]; created_at: string };
  onSetCredits: (n: number) => void;
  onSetPlan: (p: "free" | "plus" | "pro" | "ultra") => void;
  onToggleBan: () => void;
}) {
  const [credits, setCredits] = useState(String(user.credits));
  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{user.full_name || user.email}</span>
            {user.roles.includes("developer") && (
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">DEV</span>
            )}
            {user.roles.includes("admin") && (
              <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">ADMIN</span>
            )}
            {user.banned && (
              <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold text-destructive">محظور</span>
            )}
          </div>
          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            انضم {new Date(user.created_at).toLocaleDateString("ar-EG")}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">الكريدت</label>
          <div className="flex gap-1">
            <Input
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="h-9 w-28"
            />
            <Button size="sm" onClick={() => onSetCredits(Number(credits) || 0)} className="h-9">
              <Save className="size-3.5" />
            </Button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">الخطة</label>
          <select
            value={user.plan}
            onChange={(e) => onSetPlan(e.target.value as "free" | "plus" | "pro" | "ultra")}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="free">Free</option>
            <option value="plus">Plus</option>
            <option value="pro">Pro</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>
        <Button
          size="sm"
          variant={user.banned ? "outline" : "destructive"}
          onClick={onToggleBan}
          className="h-9 gap-1.5"
        >
          {user.banned ? <CheckCircle2 className="size-3.5" /> : <Ban className="size-3.5" />}
          {user.banned ? "فك الحظر" : "حظر"}
        </Button>
      </div>
    </Card>
  );
}

function SettingsTab({ filter, title }: { filter: string; title: string }) {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(adminListSettings);
  const saveSetting = useServerFn(adminSetSetting);
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fetchSettings(),
  });

  const rewards = all.filter((s) => s.key.startsWith("rewards.") || s.key.startsWith("ads."));
  const costs = all.filter((s) => s.key.startsWith(filter));
  const plans = all.filter((s) => s.key.startsWith("plans."));

  const m = useMutation({
    mutationFn: (v: { key: string; value: number }) => saveSetting({ data: { key: v.key, value: v.value } }),
    onSuccess: () => { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["admin", "settings"] }); qc.invalidateQueries({ queryKey: ["app-settings"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>;

  return (
    <div className="space-y-6">
      <SettingGroup title="المكافآت والإعلانات" items={rewards} onSave={(k, v) => m.mutate({ key: k, value: v })} saving={m.isPending} />
      <SettingGroup title={title} items={costs} onSave={(k, v) => m.mutate({ key: k, value: v })} saving={m.isPending} />
      <SettingGroup title="الخطط والاشتراكات" items={plans} onSave={(k, v) => m.mutate({ key: k, value: v })} saving={m.isPending} />
    </div>
  );
}

function SettingGroup({
  title,
  items,
  onSave,
  saving,
}: {
  title: string;
  items: Array<{ key: string; value: unknown; description: string | null }>;
  onSave: (key: string, value: number) => void;
  saving: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((s) => (
          <SettingRow key={s.key} setting={s} onSave={onSave} saving={saving} />
        ))}
      </div>
    </div>
  );
}

function SettingRow({
  setting,
  onSave,
  saving,
}: {
  setting: { key: string; value: unknown; description: string | null };
  onSave: (key: string, value: number) => void;
  saving: boolean;
}) {
  const [v, setV] = useState(String(setting.value));
  const changed = v !== String(setting.value);
  return (
    <Card className="flex items-center gap-2 p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold">{setting.description || setting.key}</div>
        <div className="truncate text-[10px] text-muted-foreground">{setting.key}</div>
      </div>
      <Input
        type="number"
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="h-9 w-24"
      />
      <Button
        size="sm"
        disabled={!changed || saving}
        onClick={() => onSave(setting.key, Number(v) || 0)}
        className="h-9"
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
      </Button>
    </Card>
  );
}

function FeaturesTab() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(adminListSettings);
  const saveSetting = useServerFn(adminSetSetting);
  const { data: all = [] } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fetchSettings(),
  });
  const features = all.filter((s) => s.key.startsWith("features."));

  const m = useMutation({
    mutationFn: (v: { key: string; value: boolean }) => saveSetting({ data: { key: v.key, value: v.value } }),
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["admin", "settings"] }); qc.invalidateQueries({ queryKey: ["app-settings"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-2">
      {features.map((s) => {
        const enabled = s.value === true;
        return (
          <Card key={s.key} className="flex items-center justify-between p-3">
            <div>
              <div className="text-sm font-semibold">{s.description || s.key}</div>
              <div className="text-[10px] text-muted-foreground">{s.key}</div>
            </div>
            <Button
              size="sm"
              variant={enabled ? "default" : "outline"}
              onClick={() => m.mutate({ key: s.key, value: !enabled })}
              className="h-9 min-w-20"
            >
              {enabled ? "مفعّل" : "متوقف"}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}