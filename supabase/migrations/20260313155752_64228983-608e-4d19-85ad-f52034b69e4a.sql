
DROP POLICY IF EXISTS "Authenticated users can read conference leads" ON public.conference_leads;
DROP POLICY IF EXISTS "Authenticated users can update conference leads" ON public.conference_leads;

CREATE POLICY "Admins can read conference leads"
ON public.conference_leads FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update conference leads"
ON public.conference_leads FOR UPDATE USING (is_admin());
