-- Allow supervisors to read enrollments for their assigned classes
CREATE POLICY "supervisors_read_class_enrollments"
ON public.enrollments
FOR SELECT
USING (
  is_supervisor() AND class_id IN (
    SELECT class_id FROM supervisor_class_assignments
    WHERE supervisor_user_id = auth.uid()
  )
);

-- Allow supervisors to read students in their assigned classes
CREATE POLICY "supervisors_read_class_students"
ON public.students
FOR SELECT
USING (
  is_supervisor() AND id IN (
    SELECT e.student_id FROM enrollments e
    WHERE e.class_id IN (
      SELECT class_id FROM supervisor_class_assignments
      WHERE supervisor_user_id = auth.uid()
    )
  )
);