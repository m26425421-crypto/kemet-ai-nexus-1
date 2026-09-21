import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Star, Download, ShoppingCart, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getProduct, purchaseProduct, addReview } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/marketplace/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProduct = useServerFn(getProduct);
  const buy = useServerFn(purchaseProduct);
  const review = useServerFn(addReview);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["mp", "product", id],
    queryFn: () => fetchProduct({ data: { id } }),
  });

  const buyMut = useMutation({
    mutationFn: () => buy({ data: { id } }),
    onSuccess: (r) => {
      if (r.already) toast.info("لقد اشتريت هذا المنتج مسبقاً");
      else toast.success("تم الشراء بنجاح");
      if (r.file_url) window.open(r.file_url, "_blank");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["mp"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const reviewMut = useMutation({
    mutationFn: () => review({ data: { product_id: id, rating, comment } }),
    onSuccess: () => { toast.success("شكراً لتقييمك"); setComment(""); qc.invalidateQueries({ queryKey: ["mp","product",id] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>;
  if (!data) return null;
  const p = data.product;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/marketplace" })} className="mb-3">
        <ArrowRight className="size-4 me-1" /> عودة
      </Button>

      <Card className="overflow-hidden p-0">
        <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-accent/10">
          {p.cover_url ? <img src={p.cover_url} alt={p.title} className="size-full object-cover" /> : <div className="grid h-full place-items-center text-6xl">🎨</div>}
        </div>
        <div className="p-4">
          <h1 className="mb-1 text-xl font-bold">{p.title}</h1>
          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{p.category}</span>
            {p.rating_count > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="size-3 fill-current" />
                {p.rating_avg.toFixed(1)} ({p.rating_count})
              </span>
            )}
            <span>{p.sales_count} مبيعة</span>
          </div>
          <p className="mb-4 whitespace-pre-wrap text-sm text-muted-foreground">{p.description}</p>
          <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
            <div>
              <div className="text-xs text-muted-foreground">السعر</div>
              <div className="text-2xl font-bold text-primary">{p.price_credits} كريدت</div>
            </div>
            <Button onClick={() => buyMut.mutate()} disabled={buyMut.isPending} className="gap-1.5">
              <ShoppingCart className="size-4" /> شراء
            </Button>
          </div>
        </div>
      </Card>

      <h2 className="mt-6 mb-2 text-sm font-bold">المراجعات ({data.reviews.length})</h2>
      <Card className="p-3">
        <div className="mb-2 flex items-center gap-1">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className={"size-5 " + (n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="اكتب مراجعتك..." rows={2} className="mb-2" />
        <Button size="sm" onClick={() => reviewMut.mutate()} disabled={reviewMut.isPending}>إرسال المراجعة</Button>
      </Card>

      <div className="mt-3 space-y-2">
        {data.reviews.map((r) => (
          <Card key={r.id} className="p-3">
            <div className="mb-1 flex items-center gap-1 text-amber-500">
              {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-3 fill-current" />)}
            </div>
            {r.comment && <div className="text-sm">{r.comment}</div>}
            <div className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ar-EG")}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}