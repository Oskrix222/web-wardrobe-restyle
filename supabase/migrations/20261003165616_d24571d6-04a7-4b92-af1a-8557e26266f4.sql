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
