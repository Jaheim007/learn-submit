-- Add role sync triggers for admins and supervisors
-- Grant admin role trigger function
CREATE OR REPLACE FUNCTION public.grant_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Grant supervisor role trigger function  
CREATE OR REPLACE FUNCTION public.grant_supervisor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'supervisor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_admins_role ON public.admins;
DROP TRIGGER IF EXISTS trg_supervisors_role ON public.supervisors;

-- Create triggers
CREATE TRIGGER trg_admins_role
  AFTER INSERT ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_admin_role();

CREATE TRIGGER trg_supervisors_role
  AFTER INSERT ON public.supervisors
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_supervisor_role();

-- Update students policy to prevent admin/supervisor insertion
DROP POLICY IF EXISTS "Students self-insert only (non-admin/supervisor)" ON public.students;

CREATE POLICY "Students self-insert only (non-admin/supervisor)"
ON public.students
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND NOT public.is_admin()
  AND NOT public.is_supervisor()
);

-- Ensure users can read their own roles policy exists
DROP POLICY IF EXISTS "Users can read their roles" ON public.user_roles;

CREATE POLICY "Users can read their roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());