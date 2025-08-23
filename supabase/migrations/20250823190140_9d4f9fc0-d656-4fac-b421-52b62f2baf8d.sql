-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION public.prevent_primary_class_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Allow changes if user is admin
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  
  -- Prevent changing primary_class_id if it already has a value
  IF OLD.primary_class_id IS NOT NULL AND NEW.primary_class_id != OLD.primary_class_id THEN
    RAISE EXCEPTION 'primary_class_id is immutable for non-admin users';
  END IF;
  
  RETURN NEW;
END;
$$;