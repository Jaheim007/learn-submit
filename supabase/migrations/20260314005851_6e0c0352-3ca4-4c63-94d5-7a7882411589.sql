DROP POLICY IF EXISTS "supervisors_read_class_students" ON public.students;

CREATE POLICY "supervisors_read_class_students"
ON public.students
FOR SELECT
TO authenticated
USING (
  is_supervisor()
  AND EXISTS (
    SELECT 1
    FROM public.class_enrollments ce
    JOIN public.supervisor_class_assignments sca
      ON sca.class_id = ce.class_id
    WHERE ce.user_id = students.user_id
      AND sca.supervisor_user_id = auth.uid()
  )
);