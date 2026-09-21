import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ADHKAR } from "@/data/islamic/adhkar";
import { RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdhkarTab() {
  const [groupId, setGroupId] = useState(ADHKAR[0].id);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const group = ADHKAR.find((g) => g.id === groupId)!;

  const keyOf = (i: number) => `${groupId}:${i}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ADHKAR.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroupId(g.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              g.id === groupId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-secondary-foreground",
            )}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {group.items.map((d, i) => {
          const done = counts[keyOf(i)] ?? 0;
          const complete = done >= d.count;
          return (
            <Card
              key={keyOf(i)}
              className={cn("p-3 transition", complete && "border-primary/60 bg-primary/5")}
            >
              <p className="text-right text-lg leading-[2.2]">{d.text}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">المصدر: {d.source}</p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant={complete ? "secondary" : "default"}
                  onClick={() =>
                    setCounts((c) => ({ ...c, [keyOf(i)]: Math.min(d.count, (c[keyOf(i)] ?? 0) + 1) }))
                  }
                >
                  {complete ? <Check className="size-4" /> : null}
                  {done} / {d.count}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCounts((c) => ({ ...c, [keyOf(i)]: 0 }))}
                  aria-label="إعادة"
                >
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
