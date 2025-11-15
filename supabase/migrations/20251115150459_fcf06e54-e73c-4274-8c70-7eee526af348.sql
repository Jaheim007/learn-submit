-- Create table to store FCM tokens for push notifications
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS on fcm_tokens
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own FCM tokens
CREATE POLICY "Users can insert their own FCM tokens"
  ON public.fcm_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own FCM tokens"
  ON public.fcm_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own FCM tokens"
  ON public.fcm_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FCM tokens"
  ON public.fcm_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all tokens (for sending notifications)
CREATE POLICY "Admins can view all FCM tokens"
  ON public.fcm_tokens FOR SELECT
  USING (public.is_admin());

-- Create index for faster lookups
CREATE INDEX idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);

-- Update timestamp trigger
CREATE TRIGGER update_fcm_tokens_updated_at
  BEFORE UPDATE ON public.fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to notify students about new projects
CREATE OR REPLACE FUNCTION notify_students_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  class_record RECORD;
  student_record RECORD;
BEGIN
  -- Get all classes associated with this project
  FOR class_record IN
    SELECT c.id, c.code, c.title
    FROM public.class_projects cp
    JOIN public.classes c ON c.id = cp.class_id
    WHERE cp.project_id = NEW.id
  LOOP
    -- Get all students enrolled in this class
    FOR student_record IN
      SELECT DISTINCT s.user_id, s.full_name
      FROM public.enrollments e
      JOIN public.students s ON s.id = e.student_id
      WHERE e.class_id = class_record.id AND s.is_active = true
    LOOP
      -- Create notification for each student
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        body,
        metadata
      ) VALUES (
        student_record.user_id,
        'project_created',
        'Nouveau projet disponible',
        'Un nouveau projet "' || NEW.title || '" a été ajouté pour ' || class_record.title,
        jsonb_build_object(
          'project_id', NEW.id,
          'project_code', NEW.code,
          'class_id', class_record.id,
          'class_code', class_record.code
        )
      );
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger for new projects
CREATE TRIGGER trigger_notify_students_new_project
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_students_new_project();

-- Function to notify students about new course materials
CREATE OR REPLACE FUNCTION notify_students_new_course_material()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  class_record RECORD;
  student_record RECORD;
BEGIN
  -- Get class information
  SELECT id, code, title INTO class_record
  FROM public.classes
  WHERE id = NEW.class_id;
  
  -- Get all students enrolled in this class
  FOR student_record IN
    SELECT DISTINCT s.user_id, s.full_name
    FROM public.enrollments e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.class_id = NEW.class_id AND s.is_active = true
  LOOP
    -- Create notification for each student
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      body,
      metadata
    ) VALUES (
      student_record.user_id,
      'course_material_added',
      'Nouveau contenu de cours',
      'Nouveau matériel "' || NEW.title || '" ajouté pour ' || class_record.title,
      jsonb_build_object(
        'material_id', NEW.id,
        'class_id', class_record.id,
        'class_code', class_record.code
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger for new course materials
CREATE TRIGGER trigger_notify_students_new_course_material
  AFTER INSERT ON public.course_materials
  FOR EACH ROW
  EXECUTE FUNCTION notify_students_new_course_material();