-- Fix RLS for multi-tenant Submito org tables
-- 1) submito_organizations
ALTER TABLE public.submito_organizations ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies if they exist (idempotent)
DROP POLICY IF EXISTS "orgs_insert_authenticated" ON public.submito_organizations;
DROP POLICY IF EXISTS "orgs_select_member_or_admin" ON public.submito_organizations;
DROP POLICY IF EXISTS "orgs_update_owner_or_admin" ON public.submito_organizations;
DROP POLICY IF EXISTS "orgs_delete_admin_only" ON public.submito_organizations;

-- Allow any authenticated user to create an organization
CREATE POLICY "orgs_insert_authenticated"
ON public.submito_organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow members of the org or admins to read organizations
CREATE POLICY "orgs_select_member_or_admin"
ON public.submito_organizations
FOR SELECT
TO authenticated
USING (
  public.is_admin() OR public.is_member_of_org(id)
);

-- Allow org members or admins to update their organization
CREATE POLICY "orgs_update_owner_or_admin"
ON public.submito_organizations
FOR UPDATE
TO authenticated
USING (
  public.is_admin() OR public.is_member_of_org(id)
)
WITH CHECK (
  public.is_admin() OR public.is_member_of_org(id)
);

-- Only admins can delete organizations
CREATE POLICY "orgs_delete_admin_only"
ON public.submito_organizations
FOR DELETE
TO authenticated
USING (public.is_admin());


-- 2) submito_organization_users
ALTER TABLE public.submito_organization_users ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies if they exist (idempotent)
DROP POLICY IF EXISTS "org_users_select_self_or_admin" ON public.submito_organization_users;
DROP POLICY IF EXISTS "org_users_insert_self_or_admin" ON public.submito_organization_users;
DROP POLICY IF EXISTS "org_users_update_owner_or_admin" ON public.submito_organization_users;
DROP POLICY IF EXISTS "org_users_delete_owner_or_admin" ON public.submito_organization_users;

-- Allow users to see membership rows where they belong, and admins to see all
CREATE POLICY "org_users_select_self_or_admin"
ON public.submito_organization_users
FOR SELECT
TO authenticated
USING (
  public.is_admin() OR user_id = auth.uid() OR public.is_member_of_org(organization_id)
);

-- Allow users to insert their own membership record (e.g., owner on creation) or admins to insert any
CREATE POLICY "org_users_insert_self_or_admin"
ON public.submito_organization_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() OR user_id = auth.uid()
);

-- Allow organization owners or admins to update membership rows
CREATE POLICY "org_users_update_owner_or_admin"
ON public.submito_organization_users
FOR UPDATE
TO authenticated
USING (
  public.is_admin() OR public.is_organization_owner(organization_id, auth.uid())
)
WITH CHECK (
  public.is_admin() OR public.is_organization_owner(organization_id, auth.uid())
);

-- Allow organization owners or admins to delete membership rows
CREATE POLICY "org_users_delete_owner_or_admin"
ON public.submito_organization_users
FOR DELETE
TO authenticated
USING (
  public.is_admin() OR public.is_organization_owner(organization_id, auth.uid())
);
