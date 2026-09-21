import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyVideo, listMyVideos } from "@/lib/video.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Trash2, Video, Sparkles, Clock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-videos")({
  component: MyVideos,
});

function MyVideos() {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const list = useServerFn(listMyVideos);
  const del = useServerFn(deleteMyVideo);

  const { data, isLoading } = useQuery({
    queryKey: ["myVideos"],
    queryFn: () => list(),
    refetchInterval: (q) => {
      const rows = q.state.data;
      if (!rows) return false;
      return rows.some(
        (r) => r.status === "processing" || r.status === "pending",
      )
        ? 8000
        : false;
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myVideos"] });
      toast.success(locale === "ar" ? "تم الحذف" : "Deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "error"),
  });

  async function download(url: string, id: string) {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const a = document.createElement("a");
      const dl = URL.createObjectURL(blob);
      a.href = dl;
      a.download = `kemet-video-${id}.mp4`;
      a.click();
      URL.revokeObjectURL(dl);
    } catch {
      window.open(url, "_blank");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-500/30 to-red-500/30 text-primary">
            <Video className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {locale === "ar" ? "فيديوهاتي" : "My Videos"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {locale === "ar"
                ? "جميع فيديوهاتك التي أنشأتها بالذكاء الاصطناعي"
                : "All your AI-generated videos"}
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to="/video-studio">
            <Sparkles className="size-4" />
            {locale === "ar" ? "جديد" : "New"}
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {locale === "ar"
            ? "لا توجد فيديوهات بعد. ابدأ من الاستوديو."
            : "No videos yet. Start from the studio."}
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((v) => {
          const segments = (v.segments as string[] | null) ?? [];
          const first = v.final_url ?? segments[0];
          const isDone = v.status === "completed";
          const isFailed = v.status === "failed" || v.status === "refunded";
          return (
            <Card key={v.id} className="overflow-hidden">
              <div className="grid gap-3 p-3 sm:grid-cols-[160px_1fr]">
                <div className="aspect-video overflow-hidden rounded-lg bg-secondary">
                  {isDone && first ? (
                    <video
                      src={first}
                      className="size-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      {isFailed ? (
                        <span className="text-xs text-destructive">
                          {locale === "ar" ? "فشل" : "Failed"}
                        </span>
                      ) : (
                        <Loader2 className="size-5 animate-spin" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between gap-2">
                  <div>
                    <div className="line-clamp-2 text-sm font-medium">{v.prompt}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {v.duration_seconds >= 60
                          ? `${v.duration_seconds / 60}m`
                          : `${v.duration_seconds}s`}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="size-3" />
                        {v.cost} {locale === "ar" ? "كريدت" : "cr"}
                      </span>
                      <span>
                        {new Date(v.created_at as string).toLocaleDateString(
                          locale === "ar" ? "ar-EG" : "en-US",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                      {!isDone && !isFailed && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                          {locale === "ar"
                            ? `${v.current_segment}/${v.total_segments}`
                            : `${v.current_segment}/${v.total_segments}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isDone && first && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => download(first, v.id as string)}
                        className="gap-1.5"
                      >
                        <Download className="size-3.5" />
                        {locale === "ar" ? "تنزيل" : "Download"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(locale === "ar" ? "حذف الفيديو؟" : "Delete video?")) {
                          deleteMut.mutate(v.id as string);
                        }
                      }}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      {locale === "ar" ? "حذف" : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}