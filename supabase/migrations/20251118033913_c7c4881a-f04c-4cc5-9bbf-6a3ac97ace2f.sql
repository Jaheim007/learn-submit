-- Fix recursive RLS on submito_organization_users
-- Drop existing policies one by one
DROP POLICY IF EXISTS "Users can view their own organization data" ON public.submito_organization_users;
DROP POLICY IF EXISTS "Users can insert their own organization data" ON public.submito_organization_users;
DROP POLICY IF EXISTS "Users can update their own organization data" ON public.submito_organization_users;
DROP POLICY IF EXISTS "Admins can view all organization users" ON public.submito_organization_users;
DROP POLICY IF EXISTS "org_users_insert_self" ON public.submito_organization_users;
DROP POLICY IF EXISTS "org_users_admin_insert" ON public.submito_organization_users;
DROP POLICY IF EXISTS "org_users_select_own_or_admin" ON public.submito_organization_users;
DROP POLICY IF EXISTS "org_users_update_own_or_admin" ON public.submito_organization_users;

-- Create new minimal, non-recursive policies
CREATE POLICY "org_users_insert_self"
ON public.submito_organization_users
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "org_users_admin_insert"
ON public.submito_organization_users
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "org_users_select_own_or_admin"
ON public.submito_organization_users
FOR SELECT
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "org_users_update_own_or_admin"
ON public.submito_organization_users
FOR UPDATE
USING (user_id = auth.uid() OR is_admin())
WITH CHECK (user_id = auth.uid() OR is_admin());