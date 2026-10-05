-- Records *when* RODO consent was given for each lead, so consent can be
-- demonstrated later (Art. 7(1) GDPR). Submission is already gated on the
-- client checking the consent box before the request is sent.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
