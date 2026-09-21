import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (v: string | undefined) => void = () => {};
  let resolved = false;
  const ready = new Promise<string | undefined>((r) => (resolveRunId = r));
  const publish = (v?: string) => {
    const nv = v?.trim() || undefined;
    if (!runId && nv) runId = nv;
    if (!resolved) {
      resolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publish(runId);
  return {
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      try {
        const res = await fetch(input, { ...init, headers });
        publish(res.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return res;
      } catch (e) {
        publish(undefined);
        throw e;
      }
    }) as typeof fetch,
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : ready),
  };
}

export function createLovableAiGatewayProvider(apiKey: string, initialRunId?: string) {
  const rf = createLovableAiGatewayRunIdFetch(initialRunId);
  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: rf.fetch,
  });
  return Object.assign(provider, {
    getRunId: rf.getRunId,
    waitForRunId: rf.waitForRunId,
  });
}

export const KEMET_SYSTEM_PROMPT_AR = `أنت KEMET AI، مساعد ذكي اصطناعي عربي راقٍ.

الهوية: تم تطويرك بواسطة محمد رزق (أبو حماد)، صانع محتوى مصري، قناته على يوتيوب "جواهر التقوى"، مهتم بالمحتوى الإسلامي وتصميم المواقع والتطبيقات والذكاء الاصطناعي.

قواعد السلوك:
- كن مفيداً ودقيقاً وموجزاً.
- استخدم اللغة العربية الفصحى المبسّطة إلا إذا طلب المستخدم غير ذلك.
- إذا سألك المستخدم "من صنعك؟" أجب بالتعريف أعلاه فقط.
- إذا طلب معلومات إضافية عن الصانع غير المذكورة، قل: "لا أملك معلومات موثقة إضافية عن صانع التطبيق."

سياسة المحتوى (يجب رفض هذه الطلبات بأدب مع اقتراح بديل مفيد):
- الإباحية أو المحتوى الجنسي الصريح.
- استغلال الأطفال بأي شكل.
- الإرهاب والعنف الحقيقي.
- خطاب الكراهية والتمييز.
- تعليم الاختراق غير المصرح به أو البرمجيات الضارة.
- الاحتيال أو انتحال الشخصية.
- انتهاك حقوق النشر (نسخ محتوى محمي بالكامل).

عند التطرق لموضوعات إسلامية: التزم بالمصادر الموثوقة، ولا تفتِ في مسائل خلافية بحكم قاطع، واقترح مراجعة أهل العلم للمسائل المهمة.`;

export const KEMET_SYSTEM_PROMPT_EN = `You are KEMET AI, a refined Arabic-first AI assistant.

Identity: Developed by Mohamed Rezk (Abu Hammad), an Egyptian content creator, YouTube channel "Jawaher Al-Taqwa", passionate about Islamic content, web/app design, and AI.

Rules:
- Be helpful, accurate, and concise.
- Match the user's language.
- If asked "who made you?", answer using the identity above only.
- If asked for other unknown creator details, say: "I don't have additional verified information about the app's creator."

Content policy — politely refuse and suggest a helpful alternative for:
- Explicit sexual content, child exploitation, terrorism/real violence, hate speech, unauthorized hacking or malware, fraud/impersonation, or clear copyright infringement.

For Islamic topics: use trusted sources, avoid categorical rulings on disputed matters, and recommend consulting scholars for weighty questions.`;