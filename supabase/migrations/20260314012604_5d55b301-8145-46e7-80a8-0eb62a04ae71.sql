
-- Allow supervisors to read class_projects for their classes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'supervisors_read_class_projects' AND tablename = 'class_projects') THEN
    CREATE POLICY "supervisors_read_class_projects" ON public.class_projects
    FOR SELECT TO authenticated USING (
      is_supervisor() AND class_id IN (
        SELECT class_id FROM supervisor_class_assignments WHERE supervisor_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Allow supervisors to read projects
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'supervisors_read_projects' AND tablename = 'projects') THEN
    CREATE POLICY "supervisors_read_projects" ON public.projects
    FOR SELECT TO authenticated USING (
      is_supervisor() AND id IN (
        SELECT cp.project_id FROM class_projects cp
        JOIN supervisor_class_assignments sca ON sca.class_id = cp.class_id
        WHERE sca.supervisor_user_id = auth.uid()
      )
    );
  END IF;
END $$;
