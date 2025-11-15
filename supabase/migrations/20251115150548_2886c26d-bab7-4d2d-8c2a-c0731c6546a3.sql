-- Drop triggers first, then recreate functions with proper search_path
DROP TRIGGER IF EXISTS trigger_notify_students_new_project ON public.projects;
DROP TRIGGER IF EXISTS trigger_notify_students_new_course_material ON public.course_materials;

DROP FUNCTION IF EXISTS notify_students_new_project();
DROP FUNCTION IF EXISTS notify_students_new_course_material();

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION notify_students_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION notify_students_new_course_material()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Recreate triggers
CREATE TRIGGER trigger_notify_students_new_project
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_students_new_project();

CREATE TRIGGER trigger_notify_students_new_course_material
  AFTER INSERT ON public.course_materials
  FOR EACH ROW
  EXECUTE FUNCTION notify_students_new_course_material();