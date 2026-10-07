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
