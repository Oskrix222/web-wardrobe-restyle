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
