import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Volume2, Play, Square, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/feature/tts")({
  component: TTSFeature,
});

function TTSFeature() {
  const { locale } = useI18n();
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    function load() {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (v.length > 0 && !voice) {
        const arVoice = v.find((x) => x.lang.startsWith("ar"));
        setVoice((arVoice ?? v[0]).name);
      }
    }
    load();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
     
  }, []);

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return toast.error(locale === "ar" ? "المتصفح لا يدعم التحويل" : "Browser TTS not supported");
    }
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.name === voice);
    if (v) utter.voice = v;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utterRef.current = utter;
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  }

  function stop() {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Volume2 className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{locale === "ar" ? "النص إلى صوت" : "Text to Speech"}</h1>
          <p className="text-xs text-muted-foreground">
            {locale === "ar" ? "حوّل أي نص لصوت طبيعي (يدعم العربية)" : "Turn text into natural speech (Arabic supported)"}
          </p>
        </div>
      </div>

      <Card className="space-y-3 p-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={locale === "ar" ? "اكتب النص هنا..." : "Type your text..."}
          rows={6}
          maxLength={5000}
          className="resize-none"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "الصوت" : "Voice"}
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-2 text-xs"
            >
              {voices.length === 0 && <option>{locale === "ar" ? "جارِ التحميل..." : "Loading..."}</option>}
              {voices.map((v) => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "السرعة" : "Rate"} · {rate.toFixed(1)}
            </label>
            <input type="range" min={0.5} max={2} step={0.1} value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "الطبقة" : "Pitch"} · {pitch.toFixed(1)}
            </label>
            <input type="range" min={0.5} max={2} step={0.1} value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {speaking ? (
            <Button onClick={stop} variant="destructive" className="h-11 flex-1 gap-2">
              <Square className="size-4" />
              {locale === "ar" ? "إيقاف" : "Stop"}
            </Button>
          ) : (
            <Button onClick={speak} disabled={!text.trim()} className="h-11 flex-1 gap-2 font-semibold">
              {speaking ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {locale === "ar" ? "تشغيل" : "Play"}
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {locale === "ar"
            ? "💡 يعمل بمحرك الصوت المدمج في متصفحك أو نظامك. جودة الصوت تختلف حسب الجهاز."
            : "💡 Uses your browser/OS TTS engine. Voice quality varies by device."}
        </p>
      </Card>
    </div>
  );
}