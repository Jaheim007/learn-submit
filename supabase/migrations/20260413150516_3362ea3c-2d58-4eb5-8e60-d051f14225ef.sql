
-- =====================================================
-- 1. FIX: SECURITY DEFINER functions missing search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_roles
    WHERE user_id = OLD.user_id AND role = 'admin';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_supervisor_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.supervisor_user_id, 'supervisor')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_roles
    WHERE user_id = OLD.supervisor_user_id AND role = 'supervisor';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_student_submission_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  student_user_id uuid;
  project_title text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT s.user_id INTO student_user_id
    FROM public.students s
    WHERE s.id = NEW.student_id;

    SELECT p.title INTO project_title
    FROM public.projects p
    WHERE p.id = NEW.project_id;

    IF student_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, metadata)
      VALUES (
        student_user_id,
        'Mise à jour de soumission',
        'Votre soumission pour "' || COALESCE(project_title, 'Projet') || '" a été mise à jour: ' || NEW.status,
        'submission_update',
        jsonb_build_object('submission_id', NEW.id, 'project_id', NEW.project_id, 'new_status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- 2. FIX: webcreator_inscriptions - restrict to admin
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view webcreator inscriptions' AND tablename = 'webcreator_inscriptions') THEN
    DROP POLICY "Authenticated users can view webcreator inscriptions" ON public.webcreator_inscriptions;
    CREATE POLICY "Only admins can view webcreator inscriptions"
    ON public.webcreator_inscriptions FOR SELECT
    USING (public.is_admin());
  END IF;
END $$;

-- =====================================================
-- 3. FIX: tutorials storage - restrict to enrolled students
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can view tutorial files for their classes' AND tablename = 'objects' AND schemaname = 'storage') THEN
    DROP POLICY "Students can view tutorial files for their classes" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "Enrolled students and admins can view tutorials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tutorials' AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.students s ON s.id = e.student_id
      WHERE s.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- 4. FIX: invitations token exposure - restrict SELECT
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view invitation by token' AND tablename = 'submito_organization_invitations') THEN
    DROP POLICY "Anyone can view invitation by token" ON public.submito_organization_invitations;
    CREATE POLICY "Authenticated users can view own invitations"
    ON public.submito_organization_invitations FOR SELECT
    TO authenticated
    USING (
      email = auth.email()
      OR public.is_member_of_org(organization_id)
      OR public.is_admin()
    );
  END IF;
END $$;
