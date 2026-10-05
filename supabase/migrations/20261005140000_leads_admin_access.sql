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
