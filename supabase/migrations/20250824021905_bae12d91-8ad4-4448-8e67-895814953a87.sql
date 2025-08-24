-- Fix the function search path issue
CREATE OR REPLACE FUNCTION public.lock_submission_on_insert()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.locked_at IS NULL THEN
    NEW.locked_at := now();
  END IF;
  RETURN NEW;
END;
$$;