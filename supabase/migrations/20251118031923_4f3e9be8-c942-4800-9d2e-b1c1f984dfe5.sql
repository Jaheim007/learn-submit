-- Fix infinite recursion in submito_organization_users RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON submito_organization_users;
DROP POLICY IF EXISTS "Users can insert their own organization memberships" ON submito_organization_users;
DROP POLICY IF EXISTS "Organization owners can manage users" ON submito_organization_users;

-- Create security definer function to check organization ownership
CREATE OR REPLACE FUNCTION public.is_organization_owner(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.submito_organization_users
    WHERE organization_id = _org_id
      AND user_id = _user_id
      AND is_owner = true
  )
$$;

-- Create new policies using security definer function
CREATE POLICY "Users can view their own organization memberships"
ON submito_organization_users
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own organization memberships"
ON submito_organization_users
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organization owners can manage users"
ON submito_organization_users
FOR ALL
USING (is_organization_owner(organization_id, auth.uid()));

CREATE POLICY "Service role can manage organization users"
ON submito_organization_users
FOR ALL
USING (auth.role() = 'service_role');