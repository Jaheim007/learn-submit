-- Create dedicated admin and supervisor tables
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supervisors (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supervisors_updated_at
  BEFORE UPDATE ON public.supervisors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to sync roles when admin/supervisor records are created
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_supervisor_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'supervisor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to auto-sync roles
CREATE TRIGGER sync_admin_role_trigger
  AFTER INSERT ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_admin_role();

CREATE TRIGGER sync_supervisor_role_trigger
  AFTER INSERT ON public.supervisors
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_supervisor_role();

-- Add unique constraint to user_roles
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_role_unique 
    UNIQUE (user_id, role);
  EXCEPTION
    WHEN duplicate_table THEN
      -- Constraint already exists, ignore
      NULL;
  END;
END
$$;

-- RLS Policies for admins table
CREATE POLICY "Admins can view all admin records"
  ON public.admins
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Service can insert admin records"
  ON public.admins
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can update admin records"
  ON public.admins
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete admin records"
  ON public.admins
  FOR DELETE
  USING (public.is_admin());

-- RLS Policies for supervisors table
CREATE POLICY "Admins can view all supervisor records"
  ON public.supervisors
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Supervisors can view their own record"
  ON public.supervisors
  FOR SELECT
  USING (public.is_supervisor() AND user_id = auth.uid());

CREATE POLICY "Service can insert supervisor records"
  ON public.supervisors
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can update supervisor records"
  ON public.supervisors
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Supervisors can update their own record"
  ON public.supervisors
  FOR UPDATE
  USING (public.is_supervisor() AND user_id = auth.uid());

CREATE POLICY "Admins can delete supervisor records"
  ON public.supervisors
  FOR DELETE
  USING (public.is_admin());

-- Ensure service role can insert into user_roles (for claim-admin)
DROP POLICY IF EXISTS "Service role can insert user roles" ON public.user_roles;
CREATE POLICY "Service role can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');