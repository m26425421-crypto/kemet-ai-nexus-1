import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Copy, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/feature/stt")({
  component: STTFeature,
});

interface SpeechRecognitionResult {
  isFinal: boolean;
  [i: number]: { transcript: string };
}

function STTFeature() {
  const { locale, t } = useI18n();
  const [lang, setLang] = useState("ar-SA");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) setSupported(false);
  }, []);

  function toggle() {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return toast.error(
        locale === "ar"
          ? "المتصفح لا يدعم التعرف على الصوت. جرّب Chrome."
          : "Speech recognition not supported. Try Chrome.",
      );
    }
    if (listening) {
      const rec = recognitionRef.current as { stop?: () => void } | null;
      rec?.stop?.();
      setListening(false);
      return;
    }
    const rec = new (Ctor as new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (e: { resultIndex: number; results: SpeechRecognitionResult[] }) => void;
      onerror: (e: { error: string }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    })();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalT = "";
      let interimT = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalT += r[0].transcript;
        else interimT += r[0].transcript;
      }
      if (finalT) setTranscript((t2) => (t2 ? t2 + " " : "") + finalT);
      setInterim(interimT);
    };
    rec.onerror = (e) => {
      toast.error(`${e.error}`);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  function copy() {
    navigator.clipboard.writeText(transcript);
    toast.success(t("copied"));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Mic className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{locale === "ar" ? "الصوت إلى نص" : "Speech to Text"}</h1>
          <p className="text-xs text-muted-foreground">
            {locale === "ar" ? "حوّل صوتك إلى نص مباشرة (يدعم العربية)" : "Live transcription (Arabic supported)"}
          </p>
        </div>
      </div>

      {!supported ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {locale === "ar"
            ? "متصفحك لا يدعم التعرف على الصوت. استخدم Chrome أو Edge على جهازك."
            : "Your browser does not support speech recognition. Use Chrome or Edge."}
        </Card>
      ) : (
        <Card className="space-y-3 p-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "اللغة" : "Language"}
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              disabled={listening}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="ar-SA">العربية (السعودية)</option>
              <option value="ar-EG">العربية (مصر)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="fr-FR">Français</option>
              <option value="es-ES">Español</option>
              <option value="tr-TR">Türkçe</option>
            </select>
          </div>
          <Button
            onClick={toggle}
            className={
              "h-14 w-full gap-2 text-base font-semibold " +
              (listening ? "bg-destructive hover:bg-destructive/90" : "")
            }
          >
            {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            {listening
              ? locale === "ar" ? "إيقاف التسجيل" : "Stop"
              : locale === "ar" ? "ابدأ التسجيل" : "Start recording"}
          </Button>
          <div className="min-h-[120px] whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed">
            {transcript}
            {interim && <span className="text-muted-foreground"> {interim}</span>}
            {!transcript && !interim && (
              <span className="text-muted-foreground">
                {locale === "ar" ? "النص سيظهر هنا..." : "Transcript will appear here..."}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={copy} disabled={!transcript} className="flex-1 gap-1.5">
              <Copy className="size-3.5" /> {t("copy")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTranscript("")} disabled={!transcript} className="flex-1 gap-1.5">
              <Trash2 className="size-3.5" /> {t("clear")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}