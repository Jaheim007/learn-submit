-- Fix onboarding: ensure org creator becomes owner automatically and can pass RLS
-- 1) Add created_by to submito_organizations and set via trigger
ALTER TABLE public.submito_organizations ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE OR REPLACE FUNCTION public.set_submito_org_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_submito_org_created_by ON public.submito_organizations;
CREATE TRIGGER trg_set_submito_org_created_by
BEFORE INSERT ON public.submito_organizations
FOR EACH ROW
EXECUTE FUNCTION public.set_submito_org_created_by();

-- 2) Attach trigger to auto-add creator as owner member after org insert
--    Reuse existing function public.auto_add_org_owner()
DROP TRIGGER IF EXISTS trg_auto_add_org_owner ON public.submito_organizations;
CREATE TRIGGER trg_auto_add_org_owner
AFTER INSERT ON public.submito_organizations
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_org_owner();

-- 3) Broaden RLS to allow creators to view their orgs immediately (before membership exists)
ALTER TABLE IF EXISTS public.submito_organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS submito_orgs_select_creator ON public.submito_organizations;
CREATE POLICY submito_orgs_select_creator
ON public.submito_organizations
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- 4) Update org users insert policy to allow the creator to insert themselves if needed
ALTER TABLE IF EXISTS public.submito_organization_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_users_insert_owner_or_admin ON public.submito_organization_users;
DROP POLICY IF EXISTS org_users_insert_owner_admin_creator ON public.submito_organization_users;
CREATE POLICY org_users_insert_owner_admin_creator
ON public.submito_organization_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() OR
  public.is_organization_owner(organization_id, auth.uid()) OR
  (
    -- Allow the org creator to add themselves to their org
    auth.uid() = user_id AND
    organization_id IN (
      SELECT id FROM public.submito_organizations WHERE created_by = auth.uid()
    )
  )
);
