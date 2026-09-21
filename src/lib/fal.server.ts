// Server-only helpers for calling Fal.ai queue API for video generation.
// FAL_API_KEY format: "key_id:key_secret".

export type FalSubmitResult = {
  request_id: string;
  status_url: string;
  response_url: string;
};

export type FalStatus =
  | { kind: "queued"; queuePosition?: number }
  | { kind: "processing" }
  | { kind: "completed"; videoUrl: string }
  | { kind: "failed"; error: string };

function authHeader() {
  const key = process.env.FAL_API_KEY;
  if (!key) throw new Error("FAL_NOT_CONFIGURED");
  return `Key ${key}`;
}

export function aspectRatioFor(aspect: string) {
  if (aspect === "portrait") return "9:16";
  if (aspect === "square") return "1:1";
  return "16:9";
}

/**
 * Submits one segment to the Fal queue. Returns request_id and status_url.
 * Duration must be "5" or "10" for Kling v2.1.
 */
export async function submitFalSegment(params: {
  model: string;
  mode: "t2v" | "i2v";
  prompt: string;
  imageUrl?: string | null;
  segmentSeconds: number;
  aspect: string;
}): Promise<FalSubmitResult> {
  const body: Record<string, unknown> = {
    prompt: params.prompt,
    duration: String(params.segmentSeconds),
    aspect_ratio: aspectRatioFor(params.aspect),
  };
  if (params.mode === "i2v") {
    if (!params.imageUrl) throw new Error("IMAGE_REQUIRED");
    body.image_url = params.imageUrl;
  }

  const url = `https://queue.fal.run/${params.model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) throw new Error("FAL_INVALID_KEY");
    if (res.status === 429) throw new Error("FAL_RATE_LIMIT");
    throw new Error(`FAL_SUBMIT_FAILED:${res.status}:${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    request_id?: string;
    status_url?: string;
    response_url?: string;
  };
  if (!json.request_id || !json.status_url || !json.response_url) {
    throw new Error("FAL_SUBMIT_BAD_RESPONSE");
  }
  return {
    request_id: json.request_id,
    status_url: json.status_url,
    response_url: json.response_url,
  };
}

/**
 * Polls a Fal request. Uses the model prefix and request_id to derive
 * status/result URLs (documented Fal queue pattern).
 */
export async function pollFalSegment(model: string, requestId: string): Promise<FalStatus> {
  // Fal queue URL pattern: https://queue.fal.run/{app_id}/requests/{request_id}/status
  const modelPrefix = model.split("/").slice(0, 2).join("/"); // e.g. "fal-ai/kling-video"
  const statusUrl = `https://queue.fal.run/${modelPrefix}/requests/${requestId}/status`;
  const res = await fetch(statusUrl, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) return { kind: "failed", error: "FAL_INVALID_KEY" };
    if (res.status === 404) return { kind: "failed", error: "FAL_REQUEST_NOT_FOUND" };
    return { kind: "failed", error: `FAL_STATUS_${res.status}:${text.slice(0, 120)}` };
  }
  const s = (await res.json()) as { status?: string; queue_position?: number };
  const status = (s.status ?? "").toUpperCase();
  if (status === "IN_QUEUE") return { kind: "queued", queuePosition: s.queue_position };
  if (status === "IN_PROGRESS") return { kind: "processing" };
  if (status === "COMPLETED") {
    const resultUrl = `https://queue.fal.run/${modelPrefix}/requests/${requestId}`;
    const r = await fetch(resultUrl, { headers: { Authorization: authHeader() } });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { kind: "failed", error: `FAL_RESULT_${r.status}:${text.slice(0, 120)}` };
    }
    const json = (await r.json()) as { video?: { url?: string } };
    const videoUrl = json.video?.url;
    if (!videoUrl) return { kind: "failed", error: "FAL_NO_VIDEO_URL" };
    return { kind: "completed", videoUrl };
  }
  // Unknown / FAILED / etc.
  return { kind: "failed", error: `FAL_STATUS_${status || "UNKNOWN"}` };
}

/** Map user-requested duration to segment plan for Kling (5s / 10s max). */
export function planSegments(durationSeconds: number): {
  segmentSeconds: 5 | 10;
  totalSegments: number;
} {
  if (durationSeconds <= 6) return { segmentSeconds: 5, totalSegments: 1 };
  return { segmentSeconds: 10, totalSegments: Math.ceil(durationSeconds / 10) };
}

export const DURATION_COSTS: Record<number, number> = {
  6: 20,
  30: 100,
  60: 180,
  180: 300,
  300: 500,
  600: 1000,
};

export const ALLOWED_DURATIONS = [6, 30, 60, 180, 300, 600] as const;
export type AllowedDuration = (typeof ALLOWED_DURATIONS)[number];