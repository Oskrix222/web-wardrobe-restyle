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
