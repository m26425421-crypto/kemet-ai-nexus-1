import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Scale, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ITEMS = [
  { q: "الصدقة سرًا ابتغاء وجه الله", halal: true, note: "عمل صالح؛ قال تعالى: ﴿وَإِن تُخْفُوهَا وَتُؤْتُوهَا الْفُقَرَاءَ فَهُوَ خَيْرٌ لَّكُمْ﴾ — البقرة: 271." },
  { q: "أكل مال اليتيم ظلمًا", halal: false, note: "حرام بنص القرآن — النساء: 10." },
  { q: "الوفاء بالعهد والوعد", halal: true, note: "مأمور به؛ قال تعالى: ﴿وَأَوْفُوا بِالْعَهْدِ﴾ — الإسراء: 34." },
  { q: "الغيبة وذكر المسلم بما يكره", halal: false, note: "محرمة بنص سورة الحجرات: 12." },
  { q: "الصلاة على وقتها", halal: true, note: "من أحب الأعمال إلى الله — صحيح البخاري وصحيح مسلم." },
  { q: "الغش في البيع أو الامتحان", halal: false, note: "حرام؛ قال النبي ﷺ: «من غشنا فليس منا» — صحيح مسلم." },
  { q: "بر الوالدين والإحسان إليهما", halal: true, note: "واجب عظيم دل عليه القرآن — الإسراء: 23." },
  { q: "أخذ شيء من مال شخص دون رضاه", halal: false, note: "لا يحل مال امرئ إلا بطيب نفس منه — حديث صحيح المعنى." },
  { q: "إطعام الطعام وإفشاء السلام", halal: true, note: "من خصال الخير الثابتة في الأحاديث الصحيحة." },
  { q: "شهادة الزور لتبرئة صديق", halal: false, note: "من أكبر الكبائر — صحيح البخاري وصحيح مسلم." },
  { q: "رد الأمانة إلى صاحبها", halal: true, note: "واجب؛ قال تعالى: ﴿أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا﴾ — النساء: 58." },
  { q: "السخرية من الناس والتنمر عليهم", halal: false, note: "منهي عنه بنص سورة الحجرات: 11." },
];

function shuffled() {
  return [...ITEMS].sort(() => Math.random() - 0.5);
}

export function HalalHaramTab() {
  const initial = useMemo(shuffled, []);
  const [items, setItems] = useState(initial);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const current = items[index];
  const done = index >= items.length;

  function pick(value: boolean) {
    if (!current || answer !== null) return;
    setAnswer(value);
    if (value === current.halal) setScore((old) => old + 1);
  }

  function restart() {
    setItems(shuffled());
    setIndex(0);
    setAnswer(null);
    setScore(0);
  }

  if (done) return (
    <Card className="mx-auto max-w-xl space-y-4 p-7 text-center">
      <Scale className="mx-auto size-10 text-primary" />
      <h2 className="text-2xl font-bold">انتهت الجولة</h2>
      <p className="text-4xl font-extrabold text-primary">{score} / {items.length}</p>
      <Button onClick={restart}><RotateCcw className="size-4" /> العب من جديد</Button>
    </Card>
  );

  return (
    <div className="mx-auto max-w-xl space-y-3">
      <Card className="flex items-center justify-between p-3 text-sm">
        <span>السؤال {index + 1} من {items.length}</span>
        <span className="font-bold text-primary">النتيجة: {score}</span>
      </Card>
      <Card className="space-y-5 p-5 text-center sm:p-8">
        <Scale className="mx-auto size-9 text-primary" />
        <h2 className="text-2xl font-bold">لعبة حلال أم حرام</h2>
        <div className="flex min-h-32 items-center justify-center rounded-md border bg-secondary/40 p-5 text-xl font-bold leading-relaxed">
          {current.q}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-14" onClick={() => pick(true)} disabled={answer !== null}>
            <CheckCircle2 className="size-5" /> حلال
          </Button>
          <Button className="h-14" variant="destructive" onClick={() => pick(false)} disabled={answer !== null}>
            <XCircle className="size-5" /> حرام
          </Button>
        </div>
        {answer !== null && (
          <div className="space-y-3 rounded-md border p-4 text-right">
            <p className="font-bold">{answer === current.halal ? "إجابة صحيحة" : `الإجابة الصحيحة: ${current.halal ? "حلال" : "حرام"}`}</p>
            <p className="text-sm leading-7 text-muted-foreground">{current.note}</p>
            <Button className="w-full" onClick={() => { setIndex((old) => old + 1); setAnswer(null); }}>التالي</Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">المواقف المختارة واضحة الدليل، وليست فتاوى في المسائل المختلف فيها.</p>
      </Card>
    </div>
  );
}