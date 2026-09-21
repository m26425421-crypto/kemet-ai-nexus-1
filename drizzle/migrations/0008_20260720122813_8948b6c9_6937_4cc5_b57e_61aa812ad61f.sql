
CREATE TABLE public.video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('t2v','i2v')),
  prompt text NOT NULL,
  image_url text,
  duration_seconds integer NOT NULL,
  aspect text NOT NULL DEFAULT 'landscape',
  cost integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','refunded')),
  fal_request_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_segment integer NOT NULL DEFAULT 0,
  total_segments integer NOT NULL,
  segment_seconds integer NOT NULL DEFAULT 5,
  error text,
  final_url text,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_jobs TO authenticated;
GRANT ALL ON public.video_jobs TO service_role;
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_video_jobs_all" ON public.video_jobs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX video_jobs_user_created_idx ON public.video_jobs(user_id, created_at DESC);
CREATE TRIGGER touch_video_jobs BEFORE UPDATE ON public.video_jobs
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

INSERT INTO public.app_settings(key, value) VALUES
  ('video.duration.6.cost', to_jsonb(20)),
  ('video.duration.30.cost', to_jsonb(100)),
  ('video.duration.60.cost', to_jsonb(180)),
  ('video.duration.180.cost', to_jsonb(300)),
  ('video.duration.300.cost', to_jsonb(500)),
  ('video.duration.600.cost', to_jsonb(1000)),
  ('video.model.t2v', to_jsonb('fal-ai/kling-video/v2.1/standard/text-to-video'::text)),
  ('video.model.i2v', to_jsonb('fal-ai/kling-video/v2.1/standard/image-to-video'::text))
ON CONFLICT (key) DO NOTHING;
