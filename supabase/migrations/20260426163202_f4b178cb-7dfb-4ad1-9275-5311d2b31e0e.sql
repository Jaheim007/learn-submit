-- Security sprint: remove critical privilege escalation and tighten RLS/storage access

-- 1) Remove deployed self-promotion surface from DB function metadata if present
-- The Edge Function itself is deleted from the project/deployment separately.

-- 2) Fix chat conversation RLS logic
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.chat_conversations;
DROP POLICY IF EXISTS "Teachers and academy can create conversations" ON public.chat_conversations;

CREATE POLICY "Authorized users can create conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.is_admin()
    OR public.is_academy()
    OR public.is_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('teacher', 'academy')
    )
  )
);

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
  OR EXISTS (
    SELECT 1
    FROM public.chat_participants cp
    WHERE cp.conversation_id = chat_conversations.id
      AND cp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Participants can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;

CREATE POLICY "Participants can send messages only as themselves"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.chat_participants cp
    WHERE cp.conversation_id = chat_messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Participants and staff can view messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR public.is_academy()
  OR EXISTS (
    SELECT 1
    FROM public.chat_participants cp
    WHERE cp.conversation_id = chat_messages.conversation_id
      AND cp.user_id = auth.uid()
  )
  OR (public.is_supervisor() AND EXISTS (
    SELECT 1
    FROM public.chat_conversations cc
    JOIN public.supervisor_class_assignments sca ON sca.class_id = cc.class_id
    WHERE cc.id = chat_messages.conversation_id
      AND sca.supervisor_user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Conversation creators can add participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.chat_participants;

CREATE POLICY "Conversation owners and staff can add participants"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR public.is_academy()
  OR EXISTS (
    SELECT 1
    FROM public.chat_conversations cc
    WHERE cc.id = chat_participants.conversation_id
      AND cc.created_by = auth.uid()
  )
);

CREATE POLICY "Participants and staff can view participants"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR public.is_academy()
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.chat_participants cp2
    WHERE cp2.conversation_id = chat_participants.conversation_id
      AND cp2.user_id = auth.uid()
  )
);

-- 3) Remove public reads on chatbot PII and keep only controlled public writes for chatbot flow
DROP POLICY IF EXISTS "Admins can manage all prospects" ON public.chatbot_prospects;
DROP POLICY IF EXISTS "Anyone can create prospects" ON public.chatbot_prospects;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chatbot_messages;

CREATE POLICY "Admins can manage chatbot prospects"
ON public.chatbot_prospects
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Public can create chatbot prospects only"
ON public.chatbot_prospects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND length(session_id) BETWEEN 8 AND 200
  AND (email IS NULL OR length(email) <= 320)
  AND (phone IS NULL OR length(phone) <= 64)
  AND (full_name IS NULL OR length(full_name) <= 200)
);

CREATE POLICY "Admins can manage chatbot messages"
ON public.chatbot_messages
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Public can append chatbot messages only"
ON public.chatbot_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  prospect_id IS NOT NULL
  AND content IS NOT NULL
  AND length(content) <= 10000
  AND role IN ('user', 'assistant', 'system')
  AND EXISTS (
    SELECT 1 FROM public.chatbot_prospects cp
    WHERE cp.id = chatbot_messages.prospect_id
  )
);

-- 4) Make course materials bucket private and replace broad storage policies
UPDATE storage.buckets
SET public = false
WHERE id = 'course-materials';

DROP POLICY IF EXISTS "Public read access for course materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can download course materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload course materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course materials" ON storage.objects;
DROP POLICY IF EXISTS "Supervisors can upload to their classes" ON storage.objects;
DROP POLICY IF EXISTS "Supervisors can delete their course materials" ON storage.objects;

CREATE POLICY "Authorized users can read course material files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND (
    public.is_admin()
    OR public.is_academy()
    OR name LIKE 'course-images/%'
    OR (
      (storage.foldername(name))[1] ~ '^[0-9]+$'
      AND (
        EXISTS (
          SELECT 1
          FROM public.enrollments e
          JOIN public.students s ON s.id = e.student_id
          WHERE s.user_id = auth.uid()
            AND e.class_id = ((storage.foldername(name))[1])::bigint
        )
        OR EXISTS (
          SELECT 1
          FROM public.supervisor_class_assignments sca
          WHERE sca.supervisor_user_id = auth.uid()
            AND sca.class_id = ((storage.foldername(name))[1])::bigint
        )
      )
    )
  )
);

CREATE POLICY "Authorized staff can upload course material files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials'
  AND (
    public.is_admin()
    OR public.is_academy()
    OR (
      public.is_supervisor()
      AND (
        name LIKE 'course-images/%'
        OR (
          (storage.foldername(name))[1] ~ '^[0-9]+$'
          AND EXISTS (
            SELECT 1
            FROM public.supervisor_class_assignments sca
            WHERE sca.supervisor_user_id = auth.uid()
              AND sca.class_id = ((storage.foldername(name))[1])::bigint
          )
        )
      )
    )
  )
);

CREATE POLICY "Authorized staff can update course material files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND (
    public.is_admin()
    OR public.is_academy()
    OR (
      public.is_supervisor()
      AND (
        name LIKE 'course-images/%'
        OR (
          (storage.foldername(name))[1] ~ '^[0-9]+$'
          AND EXISTS (
            SELECT 1
            FROM public.supervisor_class_assignments sca
            WHERE sca.supervisor_user_id = auth.uid()
              AND sca.class_id = ((storage.foldername(name))[1])::bigint
          )
        )
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'course-materials'
  AND (
    public.is_admin()
    OR public.is_academy()
    OR (
      public.is_supervisor()
      AND (
        name LIKE 'course-images/%'
        OR (
          (storage.foldername(name))[1] ~ '^[0-9]+$'
          AND EXISTS (
            SELECT 1
            FROM public.supervisor_class_assignments sca
            WHERE sca.supervisor_user_id = auth.uid()
              AND sca.class_id = ((storage.foldername(name))[1])::bigint
          )
        )
      )
    )
  )
);

CREATE POLICY "Authorized staff can delete course material files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND (
    public.is_admin()
    OR public.is_academy()
    OR (
      public.is_supervisor()
      AND (
        name LIKE 'course-images/%'
        OR (
          (storage.foldername(name))[1] ~ '^[0-9]+$'
          AND EXISTS (
            SELECT 1
            FROM public.supervisor_class_assignments sca
            WHERE sca.supervisor_user_id = auth.uid()
              AND sca.class_id = ((storage.foldername(name))[1])::bigint
          )
        )
      )
    )
  )
);

-- 5) Restrict project image writes while preserving public reads
DROP POLICY IF EXISTS "Allow authenticated users to upload to project-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update project-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete project-images" ON storage.objects;

CREATE POLICY "Authorized staff can upload project images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-images'
  AND (public.is_admin() OR public.is_academy() OR public.is_supervisor())
);

CREATE POLICY "Authorized staff can update project images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-images'
  AND (public.is_admin() OR public.is_academy() OR public.is_supervisor())
)
WITH CHECK (
  bucket_id = 'project-images'
  AND (public.is_admin() OR public.is_academy() OR public.is_supervisor())
);

CREATE POLICY "Authorized staff can delete project images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images'
  AND (public.is_admin() OR public.is_academy() OR public.is_supervisor())
);

-- 6) Add missing owner checks for private receipts
DROP POLICY IF EXISTS "Auth users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;

CREATE POLICY "Users can upload own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'speciale-receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'speciale-receipts'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

CREATE POLICY "Users can update own receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'speciale-receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'speciale-receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'speciale-receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);