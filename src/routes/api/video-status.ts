import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { pollFalSegment, submitFalSegment } from "@/lib/fal.server";

function serverSupabase(token: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/video-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          if (!auth.startsWith("Bearer ")) return json({ error: "UNAUTHORIZED" }, 401);
          const token = auth.slice(7);
          const supabase = serverSupabase(token);
          const { data: userData, error: userErr } = await supabase.auth.getUser(token);
          if (userErr || !userData?.user) return json({ error: "UNAUTHORIZED" }, 401);
          const userId = userData.user.id;

          const body = (await request.json()) as { jobId?: string };
          if (!body.jobId) return json({ error: "JOB_ID_REQUIRED" }, 400);

          const { data: job, error: jobErr } = await supabase
            .from("video_jobs")
            .select(
              "id,user_id,mode,prompt,image_url,duration_seconds,aspect,cost,status,fal_request_ids,segments,current_segment,total_segments,segment_seconds,error,final_url",
            )
            .eq("id", body.jobId)
            .maybeSingle();
          if (jobErr || !job) return json({ error: "JOB_NOT_FOUND" }, 404);
          if (job.user_id !== userId) return json({ error: "FORBIDDEN" }, 403);

          if (job.status === "completed" || job.status === "failed" || job.status === "refunded") {
            return json({
              status: job.status,
              progress: job.total_segments > 0 ? job.current_segment / job.total_segments : 0,
              currentSegment: job.current_segment,
              totalSegments: job.total_segments,
              segments: (job.segments as string[] | null) ?? [],
              finalUrl: job.final_url,
              error: job.error,
            });
          }

          const requestIds = (job.fal_request_ids as string[] | null) ?? [];
          const activeReqId = requestIds[job.current_segment];
          if (!activeReqId) {
            return json({ error: "NO_ACTIVE_REQUEST" }, 500);
          }

          const { data: modelSetting } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", job.mode === "t2v" ? "video.model.t2v" : "video.model.i2v")
            .maybeSingle();
          const model =
            (modelSetting?.value as string | undefined) ??
            (job.mode === "t2v"
              ? "fal-ai/kling-video/v2.1/standard/text-to-video"
              : "fal-ai/kling-video/v2.1/standard/image-to-video");

          const st = await pollFalSegment(model, activeReqId);

          if (st.kind === "queued" || st.kind === "processing") {
            return json({
              status: "processing",
              progress: job.current_segment / job.total_segments,
              currentSegment: job.current_segment,
              totalSegments: job.total_segments,
              segmentStatus: st.kind,
              queuePosition: st.kind === "queued" ? st.queuePosition : undefined,
            });
          }

          if (st.kind === "failed") {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.rpc("refund_credits", {
              _user_id: userId,
              _amount: job.cost,
              _reason: `refund_video_${job.duration_seconds}s`,
            });
            await supabase
              .from("video_jobs")
              .update({ status: "refunded", error: st.error })
              .eq("id", job.id);
            return json({ status: "refunded", error: st.error });
          }

          // Completed segment: append to segments, advance, either finish or submit next.
          const segmentsArr = ((job.segments as string[] | null) ?? []).slice();
          segmentsArr.push(st.videoUrl);
          const nextIndex = job.current_segment + 1;

          if (nextIndex >= job.total_segments) {
            await supabase
              .from("video_jobs")
              .update({
                status: "completed",
                current_segment: nextIndex,
                segments: segmentsArr,
                final_url: segmentsArr[0],
              })
              .eq("id", job.id);
            return json({
              status: "completed",
              progress: 1,
              currentSegment: nextIndex,
              totalSegments: job.total_segments,
              segments: segmentsArr,
              finalUrl: segmentsArr[0],
            });
          }

          // Submit next segment.
          try {
            const sub = await submitFalSegment({
              model,
              mode: job.mode as "t2v" | "i2v",
              prompt: job.prompt,
              imageUrl: job.image_url,
              segmentSeconds: job.segment_seconds,
              aspect: job.aspect,
            });
            const newIds = requestIds.slice();
            newIds[nextIndex] = sub.request_id;
            await supabase
              .from("video_jobs")
              .update({
                current_segment: nextIndex,
                segments: segmentsArr,
                fal_request_ids: newIds,
              })
              .eq("id", job.id);
            return json({
              status: "processing",
              progress: nextIndex / job.total_segments,
              currentSegment: nextIndex,
              totalSegments: job.total_segments,
              segmentStatus: "queued",
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : "FAL_SUBMIT_FAILED";
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.rpc("refund_credits", {
              _user_id: userId,
              _amount: job.cost,
              _reason: `refund_video_${job.duration_seconds}s`,
            });
            await supabase
              .from("video_jobs")
              .update({ status: "refunded", error: msg, segments: segmentsArr })
              .eq("id", job.id);
            return json({ status: "refunded", error: msg });
          }
        } catch (e) {
          console.error("video-status error", e);
          return json({ error: e instanceof Error ? e.message : "error" }, 500);
        }
      },
    },
  },
});