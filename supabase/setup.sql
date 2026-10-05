-- =====================================================================
-- OSCare — pełna konfiguracja bazy dla NOWEGO projektu Supabase.
-- Wklej całość w Supabase → SQL Editor → New query → Run.
-- Można uruchomić ponownie bez szkody (wszystko jest "IF NOT EXISTS").
-- Wygenerowane z plików w supabase/migrations/ — zmieniaj tamte, nie ten.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 20260906174842_33e435d9-3791-49f3-9dc7-3be7dd7bb49e.sql
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  insurance_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 20261003132127_b5ad26c3-2d88-4f2c-a0b2-a793585b3c5c.sql
-- ---------------------------------------------------------------------
-- Records *when* RODO consent was given for each lead, so consent can be
-- demonstrated later (Art. 7(1) GDPR). Submission is already gated on the
-- client checking the consent box before the request is sent.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------
-- 20261003165616_d24571d6-04a7-4b92-af1a-8557e26266f4.sql
-- ---------------------------------------------------------------------
-- Blog: posts table, public read / authenticated-write RLS, a public image
-- bucket for post covers and inline images, and two SECURITY DEFINER counters
-- so anonymous visitors can bump view/click stats without any write access
-- to the table itself.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_html TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  contact_click_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx
  ON public.blog_posts (status, published_at DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Visitors can read published posts only.
DROP POLICY IF EXISTS "Published posts are public" ON public.blog_posts;
CREATE POLICY "Published posts are public" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Logged-in admins (Oskar / Izumi) see and manage everything, drafts included.
DROP POLICY IF EXISTS "Authenticated users read all posts" ON public.blog_posts;
CREATE POLICY "Authenticated users read all posts" ON public.blog_posts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users insert posts" ON public.blog_posts;
CREATE POLICY "Authenticated users insert posts" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users update posts" ON public.blog_posts;
CREATE POLICY "Authenticated users update posts" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users delete posts" ON public.blog_posts;
CREATE POLICY "Authenticated users delete posts" ON public.blog_posts
  FOR DELETE TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.set_blog_posts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_set_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_blog_posts_updated_at();

-- Anonymous-safe counters: visitors can call these RPCs, but can never write
-- to blog_posts directly (no anon INSERT/UPDATE policy exists above).
CREATE OR REPLACE FUNCTION public.increment_blog_post_view(post_slug TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug AND status = 'published';
$$;

CREATE OR REPLACE FUNCTION public.increment_blog_post_contact_click(post_slug TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts
  SET contact_click_count = contact_click_count + 1
  WHERE slug = post_slug AND status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_post_view(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_blog_post_contact_click(TEXT) TO anon, authenticated;

-- Storage bucket for cover images and inline post images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
CREATE POLICY "Blog images are publicly readable" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Authenticated users upload blog images" ON storage.objects;
CREATE POLICY "Authenticated users upload blog images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Authenticated users update blog images" ON storage.objects;
CREATE POLICY "Authenticated users update blog images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Authenticated users delete blog images" ON storage.objects;
CREATE POLICY "Authenticated users delete blog images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images');

-- ---------------------------------------------------------------------
-- 20261005120000_blog_daily_stats.sql
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 20261005130000_blog_admins.sql
-- ---------------------------------------------------------------------
-- Only allow-listed e-mails may manage the blog. Before this, any signed-in
-- user counted as an admin — and anyone can sign up with the public anon key.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.blog_admins (
  email TEXT PRIMARY KEY CHECK (email = lower(email)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No policies: the list is only read through is_blog_admin() below and edited
-- from the database console.
ALTER TABLE public.blog_admins ENABLE ROW LEVEL SECURITY;

INSERT INTO public.blog_admins (email)
VALUES ('kubowiczoskar@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_blog_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blog_admins
    WHERE email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_blog_admin() TO anon, authenticated;

-- blog_posts: swap "any authenticated user" for "allow-listed admin".
DROP POLICY IF EXISTS "Authenticated users read all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users insert posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users update posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users delete posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins read all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins insert posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins update posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins delete posts" ON public.blog_posts;

CREATE POLICY "Admins read all posts" ON public.blog_posts
  FOR SELECT TO authenticated
  USING (public.is_blog_admin());

CREATE POLICY "Admins insert posts" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_blog_admin());

CREATE POLICY "Admins update posts" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());

CREATE POLICY "Admins delete posts" ON public.blog_posts
  FOR DELETE TO authenticated
  USING (public.is_blog_admin());

-- Daily stats.
DROP POLICY IF EXISTS "Authenticated users read daily stats" ON public.blog_post_daily_stats;
DROP POLICY IF EXISTS "Admins read daily stats" ON public.blog_post_daily_stats;

CREATE POLICY "Admins read daily stats" ON public.blog_post_daily_stats
  FOR SELECT TO authenticated
  USING (public.is_blog_admin());

-- Blog images bucket: anyone may view, only admins may upload/replace/delete.
DROP POLICY IF EXISTS "Authenticated users upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete blog images" ON storage.objects;

CREATE POLICY "Admins upload blog images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND public.is_blog_admin());

CREATE POLICY "Admins update blog images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images' AND public.is_blog_admin());

CREATE POLICY "Admins delete blog images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND public.is_blog_admin());

-- ---------------------------------------------------------------------
-- 20261005140000_leads_admin_access.sql
-- ---------------------------------------------------------------------
-- Lets allow-listed admins (see blog_admins) read and delete form leads from
-- the panel at /admin/zgloszenia. Visitors can still only INSERT. Deleting
-- covers RODO erasure requests. Safe to run more than once.

GRANT SELECT, DELETE ON public.leads TO authenticated;

DROP POLICY IF EXISTS "Admins read leads" ON public.leads;
CREATE POLICY "Admins read leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_blog_admin());

DROP POLICY IF EXISTS "Admins delete leads" ON public.leads;
CREATE POLICY "Admins delete leads" ON public.leads
  FOR DELETE TO authenticated
  USING (public.is_blog_admin());
