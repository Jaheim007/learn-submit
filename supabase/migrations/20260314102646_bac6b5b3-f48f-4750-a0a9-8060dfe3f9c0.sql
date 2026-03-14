
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.submito_organization_invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.submito_organization_invitations;
CREATE POLICY "Users can view their own invitations"
  ON public.submito_organization_invitations FOR SELECT
  USING (auth.email() = email OR is_admin());
