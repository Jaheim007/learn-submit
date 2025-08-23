-- Fix function search path security issues for all functions
-- Update sync_admin_role function
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update sync_supervisor_role function
CREATE OR REPLACE FUNCTION public.sync_supervisor_role()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'supervisor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;