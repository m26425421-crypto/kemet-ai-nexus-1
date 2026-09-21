import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Plus, LayoutDashboard, Store as StoreIcon, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProducts, MP_CATEGORIES } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/marketplace")({
  component: MarketplaceLayout,
});

function MarketplaceLayout() {
  const loc = useLocation();
  if (loc.pathname !== "/marketplace") return <Outlet />;
  return <MarketplaceBrowse />;
}

const CAT_LABELS: Record<string, string> = {
  apps_android: "تطبيقات Android", apps_ios: "تطبيقات iOS", websites: "مواقع",
  games: "ألعاب", source_projects: "مشاريع", templates: "قوالب", prompts: "برومبتات",
  ai_images: "صور AI", ai_videos: "فيديو AI", ai_audio: "صوت AI", logos: "شعارات",
  thumbnails: "Thumbnails", banners: "Banners", characters: "شخصيات", bots: "Bots",
  apis: "APIs", plugins: "إضافات", designs: "تصاميم", ebooks: "كتب", courses: "كورسات",
  other: "أخرى",
};

function MarketplaceBrowse() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const fetchProducts = useServerFn(listProducts);
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["mp", "products", search, category],
    queryFn: () => fetchProducts({ data: { search, category: category || undefined } }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary">
            <StoreIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">متجر KEMET</h1>
            <p className="text-xs text-muted-foreground">اشترِ وبع منتجاتك الرقمية بالكريدت</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button asChild size="sm" variant="outline"><Link to="/marketplace/dashboard"><LayoutDashboard className="size-4 me-1" />لوحتي</Link></Button>
          <Button asChild size="sm"><Link to="/marketplace/sell"><Plus className="size-4 me-1" />بيع منتج</Link></Button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث..." className="ps-9" />
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-2">
        <CatChip active={category === ""} onClick={() => setCategory("")} label="الكل" />
        {MP_CATEGORIES.map((c) => (
          <CatChip key={c} active={category === c} onClick={() => setCategory(c)} label={CAT_LABELS[c] ?? c} />
        ))}
      </div>

      {isLoading && <div className="py-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>}
      {!isLoading && products.length === 0 && (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          لا توجد منتجات معتمدة بعد. كن أول من يبيع!
          <div className="mt-3"><Button asChild size="sm"><Link to="/marketplace/sell">أضف منتجك</Link></Button></div>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {products.map((p) => (
          <Link key={p.id} to="/marketplace/$id" params={{ id: p.id }}>
            <Card className="overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
              <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-accent/10">
                {p.cover_url ? <img src={p.cover_url} alt={p.title} loading="lazy" className="size-full object-cover" /> : (
                  <div className="grid h-full place-items-center text-4xl">🎨</div>
                )}
              </div>
              <div className="p-3">
                <div className="mb-1 line-clamp-1 text-sm font-semibold">{p.title}</div>
                <div className="mb-2 text-[10px] text-muted-foreground">{CAT_LABELS[p.category] ?? p.category}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-primary">{p.price_credits} كريدت</div>
                  {p.rating_count > 0 && (
                    <div className="flex items-center gap-0.5 text-[11px] text-amber-500">
                      <Star className="size-3 fill-current" />
                      <span>{p.rating_avg.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CatChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={
        "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition " +
        (active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}