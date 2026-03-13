
-- 1. Fix: Remove dangerous self-update policy on org users, replace with restricted version
DROP POLICY IF EXISTS "org_users_update_self_or_admin" ON public.submito_organization_users;

-- Allow admins/owners to update any member
CREATE POLICY "org_users_update_owner_admin"
ON public.submito_organization_users
FOR UPDATE
TO authenticated
USING (
  public.is_organization_owner(organization_id, auth.uid())
  OR public.is_admin_user(auth.uid())
)
WITH CHECK (
  public.is_organization_owner(organization_id, auth.uid())
  OR public.is_admin_user(auth.uid())
);

-- 2. Fix: Restrict coaching_reports to admins only
DROP POLICY IF EXISTS "Authenticated users can view all coaching reports" ON public.coaching_reports;
DROP POLICY IF EXISTS "Authenticated users can update coaching reports" ON public.coaching_reports;
DROP POLICY IF EXISTS "Authenticated users can delete coaching reports" ON public.coaching_reports;

CREATE POLICY "Admins can view coaching reports"
ON public.coaching_reports FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update coaching reports"
ON public.coaching_reports FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete coaching reports"
ON public.coaching_reports FOR DELETE USING (is_admin());

-- 3. Fix: Restrict prospect_actions to admins only
DROP POLICY IF EXISTS "Anyone can read prospect actions" ON public.prospect_actions;

CREATE POLICY "Admins can read prospect actions"
ON public.prospect_actions FOR SELECT USING (is_admin());
