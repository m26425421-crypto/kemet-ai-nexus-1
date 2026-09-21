import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, MP_CATEGORIES } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/marketplace/sell")({
  component: SellPage,
});

function SellPage() {
  const navigate = useNavigate();
  const create = useServerFn(createProduct);
  const [form, setForm] = useState({
    title: "", description: "", category: "prompts", product_type: "digital",
    price_credits: 100, cover_url: "", file_url: "", demo_url: "", keywords: "",
  });

  const m = useMutation({
    mutationFn: () => create({ data: {
      title: form.title, description: form.description, category: form.category,
      product_type: form.product_type, price_credits: Number(form.price_credits),
      cover_url: form.cover_url, file_url: form.file_url, demo_url: form.demo_url,
      keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    }}),
    onSuccess: () => {
      toast.success("تم إرسال منتجك للمراجعة");
      navigate({ to: "/marketplace/dashboard" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/marketplace" })} className="mb-3">
        <ArrowRight className="size-4 me-1" /> عودة للمتجر
      </Button>
      <Card className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary"><Upload className="size-5" /></div>
          <div>
            <h1 className="text-lg font-bold">أضف منتجك</h1>
            <p className="text-xs text-muted-foreground">سيُراجع منتجك قبل الظهور علناً</p>
          </div>
        </div>

        <div className="space-y-3">
          <Field label="العنوان *"><Input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="مثال: قالب موقع Landing عربي" /></Field>
          <Field label="الوصف">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={4000} placeholder="اشرح المنتج بالتفصيل..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الفئة *">
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {MP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="السعر (كريدت) *">
              <Input type="number" min={0} value={form.price_credits} onChange={(e) => set("price_credits", Number(e.target.value) as never)} />
            </Field>
          </div>
          <Field label="رابط صورة الغلاف"><Input value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://..." /></Field>
          <Field label="رابط ملف المنتج (يُسلَّم بعد الشراء)"><Input value={form.file_url} onChange={(e) => set("file_url", e.target.value)} placeholder="https://..." /></Field>
          <Field label="رابط عرض تجريبي (اختياري)"><Input value={form.demo_url} onChange={(e) => set("demo_url", e.target.value)} placeholder="https://..." /></Field>
          <Field label="كلمات مفتاحية (مفصولة بفواصل)"><Input value={form.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder="react, template, arabic" /></Field>

          <Button onClick={() => m.mutate()} disabled={m.isPending || !form.title.trim()} className="w-full">
            {m.isPending ? "جارٍ الإرسال..." : "إرسال للمراجعة"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}