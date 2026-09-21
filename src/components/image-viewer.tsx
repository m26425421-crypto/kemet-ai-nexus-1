import { useEffect, useState } from "react";
import { X, Download, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export type ViewerImage = { id: string; image_data: string; prompt: string };

async function toBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  return await res.blob();
}

export function ImageViewer({
  image,
  onClose,
}: {
  image: ViewerImage | null;
  onClose: () => void;
}) {
  const { locale } = useI18n();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!image) return;
    setSaved(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [image, onClose]);

  if (!image) return null;

  const filename = `kemet-${image.id}.png`;

  async function download() {
    if (!image) return;
    try {
      const blob = await toBlob(image.image_data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSaved(true);
      toast.success(locale === "ar" ? "تم حفظ الصورة" : "Image saved");
    } catch {
      toast.error(locale === "ar" ? "تعذّر حفظ الصورة" : "Could not save image");
    }
  }

  async function share() {
    if (!image) return;
    try {
      const blob = await toBlob(image.image_data);
      const file = new File([blob], filename, { type: blob.type || "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
        share?: (d: ShareData) => Promise<void>;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text: image.prompt });
        return;
      }
      if (nav.share) {
        await nav.share({ title: "KEMET AI", text: image.prompt });
        return;
      }
      await navigator.clipboard.writeText(image.prompt);
      toast.success(locale === "ar" ? "تم نسخ الوصف" : "Prompt copied");
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      toast.error(locale === "ar" ? "المشاركة غير مدعومة" : "Sharing not supported");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="close"
          className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={share}
            aria-label="share"
            className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <Share2 className="size-5" />
          </button>
          <button
            onClick={download}
            aria-label="download"
            className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            {saved ? <Check className="size-5" /> : <Download className="size-5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-2">
        <img
          src={image.image_data}
          alt={image.prompt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <p
        className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-center text-xs leading-relaxed text-white/70"
        onClick={(e) => e.stopPropagation()}
      >
        {image.prompt}
      </p>
    </div>
  );
}
