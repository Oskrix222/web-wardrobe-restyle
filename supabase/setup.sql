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

-- ---------------------------------------------------------------------
-- 20261008090000_content_calendar.sql
-- ---------------------------------------------------------------------
-- Content calendar for the admin panel (/admin/kalendarz, /admin/prawdy, /admin/polaczenia).
-- Claude uploads each content package as a campaign (one topic = one week);
-- every item waits for the admin's approvals and is published by the Worker's
-- cron (src/lib/content-publisher.server.ts). Safe to run more than once.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- One content package = one campaign, planned for one week.
CREATE TABLE IF NOT EXISTS public.content_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder TEXT NOT NULL UNIQUE, -- marketing/posty/<folder>; re-sending updates the same campaign
  title TEXT NOT NULL,
  keyword TEXT,
  week_start DATE NOT NULL, -- Monday of the planned week
  notes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Everything that gets published: blog post, feed post (carousel), story, reels.
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.content_campaigns (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('blog', 'post', 'story', 'reel')),
  position INTEGER NOT NULL DEFAULT 0, -- reel 1/2/3
  title TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  -- 'instagram' / 'facebook'; empty = the admin publishes it by hand (reminder only).
  channels TEXT[] NOT NULL DEFAULT '{instagram}',
  caption TEXT NOT NULL DEFAULT '', -- Instagram
  caption_facebook TEXT NOT NULL DEFAULT '',
  media JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ "type": "image" | "video", "path", "url" }]
  details JSONB NOT NULL DEFAULT '{}'::jsonb, -- alt text, reel script, …
  blog_post_id UUID REFERENCES public.blog_posts (id) ON DELETE SET NULL,
  media_approved BOOLEAN NOT NULL DEFAULT false,
  caption_approved BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
  publish_state JSONB NOT NULL DEFAULT '{}'::jsonb, -- per channel: container ids, permalinks
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  locked_until TIMESTAMP WITH TIME ZONE, -- stops two publisher runs touching one item
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, kind, position)
);

CREATE INDEX IF NOT EXISTS content_items_schedule_idx
  ON public.content_items (status, scheduled_at);

DROP TRIGGER IF EXISTS content_items_updated_at ON public.content_items;
CREATE TRIGGER content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- "Prawdy": facts about the offer and its limits. Claude reads them before
-- writing anything and never contradicts them or brings the topic up.
CREATE TABLE IF NOT EXISTS public.content_truths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  body TEXT NOT NULL CHECK (length(btrim(body)) > 0),
  category TEXT NOT NULL DEFAULT 'zasada' CHECK (category IN ('oferta', 'ograniczenie', 'zasada')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS content_truths_updated_at ON public.content_truths;
CREATE TRIGGER content_truths_updated_at
  BEFORE UPDATE ON public.content_truths
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.content_truths (id, body, category) VALUES
  ('00000000-0000-4000-8000-000000000001',
   'Nie mam w ofercie ubezpieczenia samochodu (OC/AC).', 'oferta'),
  ('00000000-0000-4000-8000-000000000002',
   'Osoba po próbie samobójczej nie może mieć ubezpieczenia chorobowego ani na życie (na wypadek śmierci).',
   'ograniczenie')
ON CONFLICT (id) DO NOTHING;

-- Server-only settings: the Meta (Instagram + Facebook) token and the cron's
-- last run. No policies — only the service role reads it; admins see a
-- token-free summary through content_connection_status().
CREATE TABLE IF NOT EXISTS public.content_integrations (
  provider TEXT NOT NULL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_truths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_integrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_truths TO authenticated;
GRANT ALL ON public.content_campaigns TO service_role;
GRANT ALL ON public.content_items TO service_role;
GRANT ALL ON public.content_truths TO service_role;
GRANT ALL ON public.content_integrations TO service_role;
REVOKE ALL ON public.content_integrations FROM anon, authenticated;

DROP POLICY IF EXISTS "Admins manage campaigns" ON public.content_campaigns;
CREATE POLICY "Admins manage campaigns" ON public.content_campaigns
  FOR ALL TO authenticated
  USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());

DROP POLICY IF EXISTS "Admins manage content items" ON public.content_items;
CREATE POLICY "Admins manage content items" ON public.content_items
  FOR ALL TO authenticated
  USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());

DROP POLICY IF EXISTS "Admins manage truths" ON public.content_truths;
CREATE POLICY "Admins manage truths" ON public.content_truths
  FOR ALL TO authenticated
  USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());

CREATE OR REPLACE FUNCTION public.content_connection_status()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN public.is_blog_admin() THEN jsonb_build_object(
    'meta', (
      SELECT jsonb_build_object(
        'pageName', data ->> 'pageName',
        'igUsername', data ->> 'igUsername',
        'connectedAt', data ->> 'connectedAt'
      )
      FROM public.content_integrations WHERE provider = 'meta'
    ),
    'cron', (SELECT data FROM public.content_integrations WHERE provider = 'cron')
  ) END;
$$;

REVOKE ALL ON FUNCTION public.content_connection_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.content_connection_status() TO authenticated;

-- Public bucket: Instagram/Facebook download the media from its public URLs.
-- 50 MB is the Supabase Free per-file limit (enough for a 1080p reel).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content', 'content', true, 52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins list content media" ON storage.objects;
CREATE POLICY "Admins list content media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'content' AND public.is_blog_admin());

DROP POLICY IF EXISTS "Admins upload content media" ON storage.objects;
CREATE POLICY "Admins upload content media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content' AND public.is_blog_admin());

DROP POLICY IF EXISTS "Admins update content media" ON storage.objects;
CREATE POLICY "Admins update content media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'content' AND public.is_blog_admin());

DROP POLICY IF EXISTS "Admins delete content media" ON storage.objects;
CREATE POLICY "Admins delete content media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'content' AND public.is_blog_admin());

-- ---------------------------------------------------------------------
-- 20261008120000_content_settings.sql
-- ---------------------------------------------------------------------
-- Content panel, part 2: week plan + authors + auto-reply texts (content_settings),
-- ZIP uploads waiting for Claude Code (content_uploads), the "O nas" truths category,
-- first comments with the blog link, and the log of automatic replies.
-- Requires 20261008090000_content_calendar.sql. Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.content_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS content_settings_updated_at ON public.content_settings;
CREATE TRIGGER content_settings_updated_at
  BEFORE UPDATE ON public.content_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Defaults (Polish time; day 1 = Monday … 7 = Sunday). Never overwrites edits.
INSERT INTO public.content_settings (key, value) VALUES
  ('schedule', '{
    "blog":  { "day": 1, "time": "07:00" },
    "post":  { "day": 3, "time": "18:00" },
    "story": { "day": 3, "time": "20:00" },
    "reels": [ { "day": 2, "time": "19:00" }, { "day": 4, "time": "19:00" }, { "day": 6, "time": "10:00" } ]
  }'),
  ('authors', '[
    { "name": "Oskar Kubowicz", "phone": "+48 539 075 385" },
    { "name": "Izumi Sato", "phone": "+48 123 456 789" }
  ]'),
  ('auto_reply', '{
    "instagram": {
      "enabled": false,
      "message": "Dzień dobry! Dziękujemy za komentarz. Odezwiemy się z ofertą najszybciej, jak to możliwe. Szczegóły znajdziesz też tutaj: {link}",
      "publicReply": "Dziękujemy! Wysłaliśmy Ci wiadomość prywatną 📩"
    },
    "facebook": {
      "enabled": false,
      "message": "Dzień dobry! Dziękujemy za komentarz. Odezwiemy się z ofertą najszybciej, jak to możliwe. Szczegóły znajdziesz też tutaj: {link}",
      "publicReply": "Dziękujemy! Wysłaliśmy Ci wiadomość prywatną 📩"
    }
  }')
ON CONFLICT (key) DO NOTHING;

-- ZIPs dropped into Panel → Kalendarz; Claude Code on the Mac turns each into packages.
CREATE TABLE IF NOT EXISTS public.content_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  path TEXT NOT NULL, -- in the "content" bucket
  size BIGINT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'done', 'error')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS content_uploads_updated_at ON public.content_uploads;
CREATE TRIGGER content_uploads_updated_at
  BEFORE UPDATE ON public.content_uploads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Keyword comments answered automatically (one row per comment, so nobody gets two messages).
CREATE TABLE IF NOT EXISTS public.content_replies (
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  comment_id TEXT NOT NULL,
  item_id UUID REFERENCES public.content_items (id) ON DELETE SET NULL,
  author TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (platform, comment_id)
);

-- "O nas": facts Claude may use in content (experience, team, city…).
ALTER TABLE public.content_truths DROP CONSTRAINT IF EXISTS content_truths_category_check;
ALTER TABLE public.content_truths ADD CONSTRAINT content_truths_category_check
  CHECK (category IN ('o_nas', 'oferta', 'ograniczenie', 'zasada'));

-- First comment under a post/reel (the blog link — Instagram captions can't hold links).
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS first_comment TEXT NOT NULL DEFAULT '';
-- Byline of the week's blog post; alternates between the authors.
ALTER TABLE public.content_campaigns ADD COLUMN IF NOT EXISTS author TEXT;

ALTER TABLE public.content_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_replies ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_uploads TO authenticated;
GRANT SELECT ON public.content_replies TO authenticated;
GRANT ALL ON public.content_settings TO service_role;
GRANT ALL ON public.content_uploads TO service_role;
GRANT ALL ON public.content_replies TO service_role;

DROP POLICY IF EXISTS "Admins manage content settings" ON public.content_settings;
CREATE POLICY "Admins manage content settings" ON public.content_settings
  FOR ALL TO authenticated
  USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());

DROP POLICY IF EXISTS "Admins manage uploads" ON public.content_uploads;
CREATE POLICY "Admins manage uploads" ON public.content_uploads
  FOR ALL TO authenticated
  USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());

DROP POLICY IF EXISTS "Admins read replies" ON public.content_replies;
CREATE POLICY "Admins read replies" ON public.content_replies
  FOR SELECT TO authenticated
  USING (public.is_blog_admin());

-- ZIPs go to the same bucket as the graphics.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime',
  'application/zip', 'application/x-zip-compressed'
]
WHERE id = 'content';

-- ---------------------------------------------------------------------
-- 20261009090000_security_hardening.sql
-- ---------------------------------------------------------------------
-- Security pass (October 2026). Safe to run more than once.
--
-- 1. Leads: visitors no longer write to the table directly (anyone with the public
--    key could insert anything, of any size, as fast as they liked). The form goes
--    through submit_lead(), which validates every field, rate-limits and records
--    where the visitor came from (utm_source etc. → "source").
-- 2. blog-images: the bucket stays public (images load by URL), but only admins can
--    list its files — drafts' images are no longer discoverable.

-- ---------------------------------------------------------------- 1. leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source JSONB;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_fields_check') THEN
    -- NOT VALID: enforced for new rows, old rows are left as they are.
    ALTER TABLE public.leads ADD CONSTRAINT leads_fields_check CHECK (
      char_length(name) BETWEEN 2 AND 100
      AND char_length(phone) BETWEEN 9 AND 20
      AND (email IS NULL OR char_length(email) <= 255)
      AND char_length(insurance_type) <= 40
      AND (message IS NULL OR char_length(message) <= 1000)
      AND (source IS NULL OR octet_length(source::text) <= 2000)
    ) NOT VALID;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);

CREATE OR REPLACE FUNCTION public.submit_lead(
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_insurance_type TEXT,
  p_message TEXT,
  p_source JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT := btrim(coalesce(p_name, ''));
  v_phone TEXT := btrim(coalesce(p_phone, ''));
  v_digits TEXT := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email TEXT := nullif(btrim(coalesce(p_email, '')), '');
  v_message TEXT := nullif(btrim(coalesce(p_message, '')), '');
  v_source JSONB := NULL;
  v_id UUID;
BEGIN
  IF char_length(v_name) NOT BETWEEN 2 AND 100 OR v_name ~* '(https?://|www\.)' THEN
    RAISE EXCEPTION 'invalid name' USING ERRCODE = '22023';
  END IF;
  IF v_phone !~ '^\+?[0-9 ().-]{9,20}$' OR char_length(v_digits) NOT BETWEEN 9 AND 15 THEN
    RAISE EXCEPTION 'invalid phone' USING ERRCODE = '22023';
  END IF;
  IF v_email IS NOT NULL
     AND (char_length(v_email) > 255 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'invalid email' USING ERRCODE = '22023';
  END IF;
  IF p_insurance_type IS NULL OR p_insurance_type NOT IN ('life', 'home', 'travel', 'business') THEN
    RAISE EXCEPTION 'invalid insurance type' USING ERRCODE = '22023';
  END IF;
  IF v_message IS NOT NULL AND char_length(v_message) > 1000 THEN
    RAISE EXCEPTION 'message too long' USING ERRCODE = '22023';
  END IF;

  -- Keep only the attribution keys we know, as short strings.
  IF p_source IS NOT NULL AND jsonb_typeof(p_source) = 'object' THEN
    SELECT jsonb_object_agg(key, left(value, 200))
      INTO v_source
      FROM jsonb_each_text(p_source)
     WHERE key IN ('utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                   'landing', 'referrer', 'post', 'page');
  END IF;

  -- Rate limits: the same phone at most 3 times in 10 minutes, everyone together
  -- at most 60 an hour (a real week brings a handful; a bot brings thousands).
  IF (SELECT count(*) FROM public.leads
       WHERE created_at > now() - interval '10 minutes'
         AND regexp_replace(phone, '\D', '', 'g') = v_digits) >= 3 THEN
    RAISE EXCEPTION 'too many requests' USING ERRCODE = '53400';
  END IF;
  IF (SELECT count(*) FROM public.leads WHERE created_at > now() - interval '1 hour') >= 60 THEN
    RAISE EXCEPTION 'too many requests' USING ERRCODE = '53400';
  END IF;

  INSERT INTO public.leads (name, phone, email, insurance_type, message, source)
  VALUES (v_name, v_phone, v_email, p_insurance_type, v_message, v_source)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_lead(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lead(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  TO anon, authenticated;

-- No more direct inserts from the browser — only through submit_lead().
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
REVOKE INSERT ON public.leads FROM anon, authenticated;

-- ---------------------------------------------------------------- 2. blog-images
DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins list blog images" ON storage.objects;
CREATE POLICY "Admins list blog images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'blog-images' AND public.is_blog_admin());
