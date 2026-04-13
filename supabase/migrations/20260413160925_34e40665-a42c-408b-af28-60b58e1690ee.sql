DROP POLICY IF EXISTS "supervisors_read_class_students" ON public.students;

CREATE POLICY "supervisors_read_class_students" ON public.students
  FOR SELECT
  USING (
    is_supervisor() AND EXISTS (
      SELECT 1
      FROM public.enrollments e
      JOIN public.supervisor_class_assignments sca ON sca.class_id = e.class_id
      WHERE e.student_id = students.id
        AND sca.supervisor_user_id = auth.uid()
    )
  );