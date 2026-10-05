-- Blog stats over time: one row per post per day, bumped by the same
-- SECURITY DEFINER counters the post page already calls. Only logged-in
-- admins can read it; visitors never touch the table directly.

CREATE TABLE IF NOT EXISTS public.blog_post_daily_stats (
  post_id UUID NOT NULL REFERENCES public.blog_posts (id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw')::date,
  views INTEGER NOT NULL DEFAULT 0,
  contact_clicks INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, day)
);

CREATE INDEX IF NOT EXISTS blog_post_daily_stats_day_idx ON public.blog_post_daily_stats (day DESC);

ALTER TABLE public.blog_post_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read daily stats" ON public.blog_post_daily_stats;
CREATE POLICY "Authenticated users read daily stats" ON public.blog_post_daily_stats
  FOR SELECT TO authenticated
  USING (true);

-- Explicit grants (RLS above still decides which rows) — this project doesn't
-- rely on Supabase's default table privileges, see the leads migration.
GRANT SELECT ON public.blog_post_daily_stats TO authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_blog_post_view(post_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
BEGIN
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug AND status = 'published'
  RETURNING id INTO target_id;

  IF target_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.blog_post_daily_stats (post_id, views)
  VALUES (target_id, 1)
  ON CONFLICT (post_id, day)
  DO UPDATE SET views = public.blog_post_daily_stats.views + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_blog_post_contact_click(post_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
BEGIN
  UPDATE public.blog_posts
  SET contact_click_count = contact_click_count + 1
  WHERE slug = post_slug AND status = 'published'
  RETURNING id INTO target_id;

  IF target_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.blog_post_daily_stats (post_id, contact_clicks)
  VALUES (target_id, 1)
  ON CONFLICT (post_id, day)
  DO UPDATE SET contact_clicks = public.blog_post_daily_stats.contact_clicks + 1;
END;
$$;
