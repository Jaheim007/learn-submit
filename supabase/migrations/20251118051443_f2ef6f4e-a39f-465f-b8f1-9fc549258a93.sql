-- Enable and fix RLS for multi-tenant Submito tables

-- 1) submito_organizations
ALTER TABLE IF EXISTS public.submito_organizations ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid duplicates
DROP POLICY IF EXISTS submito_orgs_insert_authenticated ON public.submito_organizations;
DROP POLICY IF EXISTS submito_orgs_select_members ON public.submito_organizations;
DROP POLICY IF EXISTS submito_orgs_select_admin ON public.submito_organizations;
DROP POLICY IF EXISTS submito_orgs_update_owner ON public.submito_organizations;
DROP POLICY IF EXISTS submito_orgs_update_admin ON public.submito_organizations;
DROP POLICY IF EXISTS submito_orgs_delete_admin ON public.submito_organizations;

-- Allow any authenticated user to create an organization
CREATE POLICY submito_orgs_insert_authenticated
ON public.submito_organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Members of an organization can view their organization
CREATE POLICY submito_orgs_select_members
ON public.submito_organizations
FOR SELECT
TO authenticated
USING (public.is_member_of_org(id));

-- Admins can view all organizations
CREATE POLICY submito_orgs_select_admin
ON public.submito_organizations
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Owners can update their organization
CREATE POLICY submito_orgs_update_owner
ON public.submito_organizations
FOR UPDATE
TO authenticated
USING (public.is_organization_owner(id, auth.uid()))
WITH CHECK (public.is_organization_owner(id, auth.uid()));

-- Admins can update organizations
CREATE POLICY submito_orgs_update_admin
ON public.submito_organizations
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admins can delete organizations
CREATE POLICY submito_orgs_delete_admin
ON public.submito_organizations
FOR DELETE
TO authenticated
USING (public.is_admin());


-- 2) submito_organization_users
ALTER TABLE IF EXISTS public.submito_organization_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_users_insert_owner_or_admin ON public.submito_organization_users;
DROP POLICY IF EXISTS org_users_select_members ON public.submito_organization_users;
DROP POLICY IF EXISTS org_users_select_admin ON public.submito_organization_users;
DROP POLICY IF EXISTS org_users_update_owner_or_admin ON public.submito_organization_users;
DROP POLICY IF EXISTS org_users_delete_owner_or_admin ON public.submito_organization_users;

-- Owners or admins can add members to their org (including themselves if needed)
CREATE POLICY org_users_insert_owner_or_admin
ON public.submito_organization_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() OR
  public.is_organization_owner(organization_id, auth.uid())
);

-- Members can view users of orgs they belong to
CREATE POLICY org_users_select_members
ON public.submito_organization_users
FOR SELECT
TO authenticated
USING (public.is_member_of_org(organization_id));

-- Admins can view all org users
CREATE POLICY org_users_select_admin
ON public.submito_organization_users
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Owners or admins can update membership within their org
CREATE POLICY org_users_update_owner_or_admin
ON public.submito_organization_users
FOR UPDATE
TO authenticated
USING (
  public.is_admin() OR
  public.is_organization_owner(organization_id, auth.uid())
)
WITH CHECK (
  public.is_admin() OR
  public.is_organization_owner(organization_id, auth.uid())
);

-- Owners or admins can remove members from their org
CREATE POLICY org_users_delete_owner_or_admin
ON public.submito_organization_users
FOR DELETE
TO authenticated
USING (
  public.is_admin() OR
  public.is_organization_owner(organization_id, auth.uid())
);
