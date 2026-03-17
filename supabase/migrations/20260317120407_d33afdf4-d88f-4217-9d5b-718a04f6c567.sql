
-- Create tutorials table
CREATE TABLE public.tutorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_type text NOT NULL DEFAULT 'url' CHECK (video_type IN ('url', 'upload')),
  video_url text,
  file_name text,
  file_path text,
  thumbnail_url text,
  class_id bigint NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Admins can manage all tutorials
CREATE POLICY "Admins can manage all tutorials"
ON public.tutorials FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Supervisors (teachers) can manage tutorials for their assigned classes
CREATE POLICY "Teachers can manage their class tutorials"
ON public.tutorials FOR ALL
TO authenticated
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

-- Students can view tutorials for their enrolled classes
CREATE POLICY "Students can view their class tutorials"
ON public.tutorials FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT e.class_id FROM enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE s.user_id = auth.uid()
  )
);

-- Academy can manage tutorials
CREATE POLICY "Academy can manage tutorials"
ON public.tutorials FOR ALL
TO authenticated
USING (is_academy())
WITH CHECK (is_academy());

-- Create trigger for updated_at
CREATE TRIGGER update_tutorials_updated_at
BEFORE UPDATE ON public.tutorials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for tutorial videos
INSERT INTO storage.buckets (id, name, public) VALUES ('tutorials', 'tutorials', false);

-- Storage policies for tutorial uploads
CREATE POLICY "Admins can manage tutorial files"
ON storage.objects FOR ALL
USING (bucket_id = 'tutorials' AND is_admin())
WITH CHECK (bucket_id = 'tutorials' AND is_admin());

CREATE POLICY "Teachers can upload tutorial files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tutorials' AND is_supervisor()
);

CREATE POLICY "Teachers can manage their tutorial files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'tutorials' AND is_supervisor()
)
WITH CHECK (
  bucket_id = 'tutorials' AND is_supervisor()
);

CREATE POLICY "Students can view tutorial files for their classes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tutorials'
);
