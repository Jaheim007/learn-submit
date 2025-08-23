-- Ensure proper triggers exist for admin and supervisor role sync
-- Drop existing triggers if they exist to recreate them properly
DROP TRIGGER IF EXISTS sync_admin_role_trigger ON public.admins;
DROP TRIGGER IF EXISTS sync_supervisor_role_trigger ON public.supervisors;

-- Create trigger function for admin role sync
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for supervisor role sync
CREATE OR REPLACE FUNCTION public.sync_supervisor_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'supervisor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers that fire after insert on admins and supervisors tables
CREATE TRIGGER sync_admin_role_trigger
  AFTER INSERT ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_admin_role();

CREATE TRIGGER sync_supervisor_role_trigger
  AFTER INSERT ON public.supervisors
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_supervisor_role();

-- Ensure admins table has proper structure (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  phone TEXT
);

-- Ensure supervisors table has proper structure (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.supervisors (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  phone TEXT
);

-- Enable RLS on both tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;