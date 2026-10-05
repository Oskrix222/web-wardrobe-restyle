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
