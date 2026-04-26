-- Security sprint follow-up: avoid recursive RLS checks in chat policies and chatbot message inserts

CREATE OR REPLACE FUNCTION public.is_chat_participant(_conversation_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.chatbot_prospect_exists(_prospect_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chatbot_prospects cp
    WHERE cp.id = _prospect_id
  );
$$;

DROP POLICY IF EXISTS "Participants and staff can view conversations" ON public.chat_conversations;
CREATE POLICY "Participants and staff can view conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR public.is_academy()
  OR (public.is_supervisor() AND (
    class_id IS NULL OR class_id IN (
      SELECT sca.class_id
      FROM public.supervisor_class_assignments sca
      WHERE sca.supervisor_user_id = auth.uid()
    )
  ))
  OR public.is_chat_participant(chat_conversations.id, auth.uid())
);

DROP POLICY IF EXISTS "Participants can send messages only as themselves" ON public.chat_messages;
CREATE POLICY "Participants can send messages only as themselves"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_chat_participant(chat_messages.conversation_id, auth.uid())
);

DROP POLICY IF EXISTS "Participants and staff can view messages" ON public.chat_messages;
CREATE POLICY "Participants and staff can view messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR public.is_academy()
  OR public.is_chat_participant(chat_messages.conversation_id, auth.uid())
  OR (public.is_supervisor() AND EXISTS (
    SELECT 1
    FROM public.chat_conversations cc
    JOIN public.supervisor_class_assignments sca ON sca.class_id = cc.class_id
    WHERE cc.id = chat_messages.conversation_id
      AND sca.supervisor_user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Participants and staff can view participants" ON public.chat_participants;
CREATE POLICY "Participants and staff can view participants"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR public.is_academy()
  OR user_id = auth.uid()
  OR public.is_chat_participant(chat_participants.conversation_id, auth.uid())
);

DROP POLICY IF EXISTS "Public can append chatbot messages only" ON public.chatbot_messages;
CREATE POLICY "Public can append chatbot messages only"
ON public.chatbot_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  prospect_id IS NOT NULL
  AND content IS NOT NULL
  AND length(content) <= 10000
  AND role IN ('user', 'assistant', 'system')
  AND public.chatbot_prospect_exists(prospect_id)
);