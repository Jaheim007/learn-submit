-- Create course_materials table
CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id BIGINT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all course materials"
  ON public.course_materials
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Supervisors can manage course materials for their assigned classes
CREATE POLICY "Supervisors can manage their class course materials"
  ON public.course_materials
  FOR ALL
  USING (
    is_supervisor() AND class_id IN (
      SELECT class_id FROM supervisor_class_assignments 
      WHERE supervisor_user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_supervisor() AND class_id IN (
      SELECT class_id FROM supervisor_class_assignments 
      WHERE supervisor_user_id = auth.uid()
    )
  );

-- Students can view course materials for their enrolled classes
CREATE POLICY "Students can view their class course materials"
  ON public.course_materials
  FOR SELECT
  USING (
    class_id IN (
      SELECT e.class_id 
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.user_id = auth.uid()
    )
  );

-- Create course_materials storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course materials
CREATE POLICY "Admins can upload course materials"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'course-materials' AND
    is_admin()
  );

CREATE POLICY "Supervisors can upload to their classes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'course-materials' AND
    is_supervisor()
  );

CREATE POLICY "Authenticated users can download course materials"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'course-materials' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can delete course materials"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'course-materials' AND
    is_admin()
  );

CREATE POLICY "Supervisors can delete their course materials"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'course-materials' AND
    is_supervisor()
  );

-- Trigger for updated_at
CREATE TRIGGER update_course_materials_updated_at
  BEFORE UPDATE ON public.course_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();