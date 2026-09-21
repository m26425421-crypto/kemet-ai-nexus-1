import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, Wallet, Package, Trash2, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSellerDashboard, listMyProducts, deleteMyProduct, listMyOrders, requestPayout } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/marketplace/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchDash = useServerFn(getSellerDashboard);
  const fetchMy = useServerFn(listMyProducts);
  const fetchOrders = useServerFn(listMyOrders);
  const del = useServerFn(deleteMyProduct);
  const payout = useServerFn(requestPayout);

  const { data: dash } = useQuery({ queryKey: ["mp", "dashboard"], queryFn: () => fetchDash() });
  const { data: mine = [] } = useQuery({ queryKey: ["mp", "mine"], queryFn: () => fetchMy() });
  const { data: orders = [] } = useQuery({ queryKey: ["mp", "orders"], queryFn: () => fetchOrders() });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["mp"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const [payoutAmt, setPayoutAmt] = useState(0);
  const [payoutMethod, setPayoutMethod] = useState("paypal");
  const [payoutAddress, setPayoutAddress] = useState("");
  const payoutMut = useMutation({
    mutationFn: () => payout({ data: { amount: payoutAmt, method: payoutMethod, details: { address: payoutAddress } } }),
    onSuccess: () => { toast.success("تم تقديم طلب السحب"); setPayoutAmt(0); setPayoutAddress(""); qc.invalidateQueries({ queryKey: ["mp","dashboard"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const bal = dash?.balance ?? { available_credits: 0, lifetime_credits: 0 };

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/marketplace" })} className="mb-3">
        <ArrowRight className="size-4 me-1" /> عودة للمتجر
      </Button>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="mb-1 text-xs text-muted-foreground">الرصيد المتاح</div>
          <div className="text-2xl font-bold text-primary">{bal.available_credits} كريدت</div>
        </Card>
        <Card className="p-4">
          <div className="mb-1 text-xs text-muted-foreground">إجمالي الأرباح</div>
          <div className="text-2xl font-bold">{bal.lifetime_credits}</div>
        </Card>
      </div>

      <Card className="mb-6 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Wallet className="size-4 text-primary" />
          <h2 className="text-sm font-bold">طلب سحب</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input type="number" placeholder="المبلغ" value={payoutAmt || ""} onChange={(e) => setPayoutAmt(Number(e.target.value))} />
          <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="paypal">PayPal</option>
            <option value="wise">Wise</option>
            <option value="bank">تحويل بنكي</option>
            <option value="crypto">USDT</option>
          </select>
          <Input placeholder="عنوان الحساب/البريد" value={payoutAddress} onChange={(e) => setPayoutAddress(e.target.value)} />
        </div>
        <Button size="sm" className="mt-2" onClick={() => payoutMut.mutate()} disabled={payoutMut.isPending || payoutAmt <= 0 || payoutAmt > bal.available_credits}>
          تقديم الطلب
        </Button>
      </Card>

      <div className="mb-3 flex items-center gap-2">
        <Package className="size-4 text-primary" />
        <h2 className="text-sm font-bold">منتجاتي ({mine.length})</h2>
      </div>
      <div className="mb-6 space-y-2">
        {mine.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            لم تضف منتجات بعد. <Link to="/marketplace/sell" className="text-primary underline">أضف الآن</Link>
          </Card>
        )}
        {mine.map((p) => (
          <Card key={p.id} className="flex items-center justify-between gap-2 p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{p.title}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <StatusBadge status={p.status} />
                <span>{p.price_credits} كريدت</span>
                <span>{p.sales_count} مبيعة</span>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => delMut.mutate(p.id)}><Trash2 className="size-4 text-destructive" /></Button>
          </Card>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <ShoppingBag className="size-4 text-primary" />
        <h2 className="text-sm font-bold">مشترياتي ({orders.length})</h2>
      </div>
      <div className="space-y-2">
        {orders.map((o) => {
          const prod = (o as unknown as { marketplace_products?: { title?: string; file_url?: string } }).marketplace_products;
          return (
            <Card key={o.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{prod?.title ?? "منتج"}</div>
                <div className="text-[11px] text-muted-foreground">{o.amount_credits} كريدت — {new Date(o.created_at).toLocaleDateString("ar-EG")}</div>
              </div>
              {prod?.file_url && <Button size="sm" variant="outline" asChild><a href={prod.file_url} target="_blank" rel="noreferrer">تنزيل</a></Button>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-500",
    approved: "bg-emerald-500/15 text-emerald-500",
    rejected: "bg-destructive/15 text-destructive",
    archived: "bg-secondary text-muted-foreground",
  };
  const label: Record<string,string> = { pending: "بانتظار المراجعة", approved: "معتمد", rejected: "مرفوض", archived: "مؤرشف" };
  return <span className={"rounded px-1.5 py-0.5 text-[10px] font-bold " + (map[status] ?? "")}>{label[status] ?? status}</span>;
}