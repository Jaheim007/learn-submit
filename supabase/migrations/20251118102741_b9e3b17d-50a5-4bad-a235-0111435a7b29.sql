-- Create invitations table for organization member invites
CREATE TABLE IF NOT EXISTS public.submito_organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.submito_organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.submito_organization_invitations ENABLE ROW LEVEL SECURITY;

-- Organization owners/admins can manage invitations
CREATE POLICY "Org owners can manage invitations"
ON public.submito_organization_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.submito_organization_users
    WHERE organization_id = submito_organization_invitations.organization_id
    AND user_id = auth.uid()
    AND (is_owner = true OR role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.submito_organization_users
    WHERE organization_id = submito_organization_invitations.organization_id
    AND user_id = auth.uid()
    AND (is_owner = true OR role = 'admin')
  )
);

-- Anyone can view invitations by token (for acceptance page)
CREATE POLICY "Anyone can view invitation by token"
ON public.submito_organization_invitations
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_submito_invitations_updated_at
BEFORE UPDATE ON public.submito_organization_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_submito_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_submito_invitations_token ON public.submito_organization_invitations(invitation_token);
CREATE INDEX idx_submito_invitations_email ON public.submito_organization_invitations(email);