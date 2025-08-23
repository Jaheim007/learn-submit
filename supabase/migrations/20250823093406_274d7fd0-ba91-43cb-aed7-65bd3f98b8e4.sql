-- Fix security issues - RLS on instructors table and function search path

-- Enable RLS on instructors table (was missing)
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for instructors (read-only for now, admin access will be handled via app)
CREATE POLICY "Instructors are publicly viewable" ON public.instructors
    FOR SELECT USING (true);

-- Fix function search path security
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Enable RLS on class_instructors table (was missing)
ALTER TABLE public.class_instructors ENABLE ROW LEVEL SECURITY;

-- Add policy for class_instructors 
CREATE POLICY "Class instructors are publicly viewable" ON public.class_instructors
    FOR SELECT USING (true);