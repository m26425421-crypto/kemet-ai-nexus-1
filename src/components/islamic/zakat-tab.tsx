import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ZakatKind = "cash" | "gold24" | "gold21" | "silver";

export function ZakatTab() {
  const [kind, setKind] = useState<ZakatKind>("cash");
  const [amount, setAmount] = useState("");
  const value = Number(amount) || 0;
  const result = useMemo(() => value * 0.025, [value]);
  const unit = kind === "cash" ? "من نفس العملة" : "جرام";

  return (
    <div className="mx-auto max-w-xl">
      <Card className="space-y-5 p-5 sm:p-8">
        <div className="text-center">
          <Calculator className="mx-auto size-9 text-primary" />
          <h2 className="mt-2 text-2xl font-bold">حاسبة الزكاة</h2>
          <p className="mt-1 text-sm text-muted-foreground">للمال أو الذهب أو الفضة بعد بلوغ النصاب ومرور الحول</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">نوع المال</label>
          <Select value={kind} onValueChange={(value) => setKind(value as ZakatKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">نقود ومدخرات</SelectItem>
              <SelectItem value="gold24">ذهب عيار 24 بالجرام</SelectItem>
              <SelectItem value="gold21">ذهب عيار 21 بالجرام</SelectItem>
              <SelectItem value="silver">فضة بالجرام</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">المبلغ أو الكمية الخاضعة للزكاة</label>
          <Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="أدخل القيمة" />
        </div>
        <div className="rounded-md border border-primary/30 bg-primary/10 p-5 text-center">
          <p className="text-sm text-muted-foreground">الزكاة الواجبة بنسبة 2.5٪</p>
          <p className="mt-2 text-3xl font-extrabold text-primary">{result.toLocaleString("ar-EG", { maximumFractionDigits: 3 })}</p>
          <p className="text-xs text-muted-foreground">{unit}</p>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          هذه أداة حسابية إرشادية. نصاب الذهب 85 جرامًا من الذهب الخالص، ونصاب الفضة 595 جرامًا. في الحُلي والديون وعروض التجارة تفاصيل فقهية؛ راجع جهة إفتاء موثوقة عند الحاجة.
        </p>
      </Card>
    </div>
  );
}