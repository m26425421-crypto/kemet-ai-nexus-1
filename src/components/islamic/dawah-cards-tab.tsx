import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Share2, Sparkles, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  name: string;
  from: string;
  to: string;
  ink: string;
  accent: string;
  text: string;
  note: string;
};

const TEMPLATES: Template[] = [
  {
    id: "nile",
    name: "نيلي ذهبي",
    from: "#0b2b3c",
    to: "#08131c",
    ink: "#f7f3e8",
    accent: "#d9b26a",
    text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    note: "سورة الطلاق — آية ٣",
  },
  {
    id: "sand",
    name: "رملي دافئ",
    from: "#efe3cf",
    to: "#d9c3a0",
    ink: "#2b1e10",
    accent: "#8a5a22",
    text: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    note: "سورة البقرة — آية ١٥٢",
  },
  {
    id: "emerald",
    name: "أخضر مدني",
    from: "#0c3b2e",
    to: "#061d16",
    ink: "#eafaf1",
    accent: "#7fd1ae",
    text: "لو كان رزقك هو حبّ الله لك، فماذا تريد بعده؟",
    note: "خاطرة",
  },
  {
    id: "night",
    name: "ليلي هادئ",
    from: "#141428",
    to: "#05050c",
    ink: "#e9e9ff",
    accent: "#9d8cff",
    text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
    note: "رواه مسلم",
  },
  {
    id: "rose",
    name: "وردي راقٍ",
    from: "#3b1020",
    to: "#170710",
    ink: "#ffeef4",
    accent: "#f2a0bd",
    text: "وَبَشِّرِ الصَّابِرِينَ",
    note: "سورة البقرة — آية ١٥٥",
  },
  {
    id: "pearl",
    name: "أبيض لؤلؤي",
    from: "#ffffff",
    to: "#e7ecf2",
    ink: "#101a24",
    accent: "#1f6f8b",
    text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    note: "سورة الرعد — آية ٢٨",
  },
];

const W = 1080;
const H = 1350;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function DawahCardsTab() {
  const [tpl, setTpl] = useState<Template>(TEMPLATES[0]);
  const [text, setText] = useState(TEMPLATES[0].text);
  const [note, setNote] = useState(TEMPLATES[0].note);
  const [signature, setSignature] = useState("KEMET AI");
  const [bg, setBg] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (img?: HTMLImageElement) => {
      ctx.clearRect(0, 0, W, H);
      if (img) {
        const scale = Math.max(W / img.width, H / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        const shade = ctx.createLinearGradient(0, 0, 0, H);
        shade.addColorStop(0, "rgba(0,0,0,0.55)");
        shade.addColorStop(0.5, "rgba(0,0,0,0.35)");
        shade.addColorStop(1, "rgba(0,0,0,0.7)");
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, W, H);
      } else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, tpl.from);
        g.addColorStop(1, tpl.to);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      const ink = img ? "#ffffff" : tpl.ink;
      const accent = img ? "#f0d08a" : tpl.accent;

      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 48, W - 96, H - 96);
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(70, 70, W - 140, H - 140);
      ctx.globalAlpha = 1;

      ctx.direction = "rtl";
      ctx.textAlign = "center";
      ctx.fillStyle = ink;

      const body = text.trim() || tpl.text;
      let size = body.length > 220 ? 44 : body.length > 120 ? 56 : body.length > 60 ? 68 : 84;
      let lines: string[] = [];
      for (;;) {
        ctx.font = `700 ${size}px Amiri, "Scheherazade New", "Noto Naskh Arabic", serif`;
        lines = wrap(ctx, body, W - 260);
        if (lines.length * size * 1.75 < H - 460 || size <= 30) break;
        size -= 4;
      }
      const lh = size * 1.75;
      let y = H / 2 - ((lines.length - 1) * lh) / 2;
      for (const line of lines) {
        ctx.fillText(line, W / 2, y);
        y += lh;
      }

      ctx.fillStyle = accent;
      ctx.font = `600 38px Amiri, "Noto Naskh Arabic", serif`;
      if (note.trim()) ctx.fillText(note.trim(), W / 2, H - 220);

      ctx.globalAlpha = 0.85;
      ctx.font = `500 30px system-ui, sans-serif`;
      ctx.fillStyle = ink;
      if (signature.trim()) ctx.fillText(signature.trim(), W / 2, H - 140);
      ctx.globalAlpha = 1;
    };

    if (bg) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => draw(img);
      img.onerror = () => draw();
      img.src = bg;
    } else {
      draw();
    }
  }, [tpl, text, note, signature, bg]);

  async function generateBackground() {
    const p = aiPrompt.trim();
    if (p.length < 3) return toast.error("اكتب وصفًا للخلفية أولاً");
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("no session");
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          prompt: `خلفية بطاقة إسلامية راقية بدون أي كتابة أو حروف: ${p}. إضاءة هادئة، زخارف إسلامية، مساحة فارغة في المنتصف للنص.`,
          quality: "standard",
          aspect: "9:16",
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { image?: string; error?: string };
      if (!res.ok) {
        toast.error(
          j.error === "INSUFFICIENT_CREDITS" ? "رصيدك غير كافٍ لإنشاء الخلفية" : (j.error ?? "تعذّر إنشاء الخلفية"),
        );
        return;
      }
      if (j.image) {
        setBg(j.image);
        toast.success("تم إنشاء الخلفية ووُضع النص عليها");
      }
    } catch {
      toast.error("تعذّر إنشاء الخلفية، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  }

  function dataUrl() {
    return canvasRef.current?.toDataURL("image/png") ?? "";
  }

  function download() {
    const url = dataUrl();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `kemet-dawah-card.png`;
    a.click();
  }

  async function share() {
    const url = dataUrl();
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "kemet-dawah-card.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "بطاقة دعوية" });
        return;
      }
      download();
    } catch {
      download();
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Card className="flex items-center justify-center p-3">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="h-auto w-full max-w-[420px] rounded-xl shadow-lg"
        />
      </Card>

      <div className="space-y-3">
        <Card className="space-y-2 p-3">
          <p className="text-xs font-semibold text-muted-foreground">قوالب جاهزة</p>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTpl(t);
                  setText(t.text);
                  setNote(t.note);
                  setBg(null);
                }}
                className={cn(
                  "rounded-lg border p-2 text-[11px] font-medium transition",
                  tpl.id === t.id ? "border-primary ring-2 ring-primary/40" : "border-border",
                )}
                style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})`, color: t.ink }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-2 p-3">
          <p className="text-xs font-semibold text-muted-foreground">نص البطاقة</p>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="text-right" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="المصدر (سورة/راوي)" />
          <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="التوقيع" />
        </Card>

        <Card className="space-y-2 p-3">
          <p className="text-xs font-semibold text-muted-foreground">خلفية بالذكاء الاصطناعي</p>
          <Input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="مثال: مسجد وقت الغروب بزخارف ذهبية"
          />
          <div className="flex gap-2">
            <Button onClick={generateBackground} disabled={busy} className="flex-1">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} أنشئ الخلفية
            </Button>
            {bg && (
              <Button variant="secondary" onClick={() => setBg(null)}>
                <ImageIcon className="size-4" /> إزالة
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            يُخصم رصيد إنشاء الصور عند توليد الخلفية، ويُكتب النص المختار فوقها تلقائيًا.
          </p>
        </Card>

        <div className="flex gap-2">
          <Button onClick={download} className="flex-1">
            <Download className="size-4" /> تحميل البطاقة
          </Button>
          <Button variant="secondary" onClick={share} className="flex-1">
            <Share2 className="size-4" /> مشاركة
          </Button>
        </div>
      </div>
    </div>
  );
}
