
-- 1. Fix: Remove overly permissive public SELECT on invitations
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.submito_organization_invitations;

-- Replace with: authenticated users can only see invitations matching their email
CREATE POLICY "Users can view their own invitations"
ON public.submito_organization_invitations
FOR SELECT
TO authenticated
USING (auth.email() = email);

-- Also allow org members to see invitations for their org
CREATE POLICY "Org members can view org invitations"
ON public.submito_organization_invitations
FOR SELECT
TO authenticated
USING (public.is_member_of_org(organization_id));

-- 2. Fix: Remove dangerous self-join INSERT policy on organization_users
DROP POLICY IF EXISTS "org_users_insert_self_or_admin" ON public.submito_organization_users;

-- 3. Fix: chat_participants self-referencing bug
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.chat_participants;

CREATE POLICY "Users can view participants of their conversations"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT cp2.user_id
    FROM public.chat_participants cp2
    WHERE cp2.conversation_id = chat_participants.conversation_id
  )
);
