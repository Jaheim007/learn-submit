DROP POLICY IF EXISTS "orgs_update_owner_or_admin" ON public.submito_organizations;

CREATE POLICY "orgs_update_owner_or_admin"
ON public.submito_organizations
FOR UPDATE TO authenticated
USING (
  public.is_organization_owner(id, auth.uid()) OR public.is_admin_user(auth.uid())
)
WITH CHECK (
  public.is_organization_owner(id, auth.uid()) OR public.is_admin_user(auth.uid())
);