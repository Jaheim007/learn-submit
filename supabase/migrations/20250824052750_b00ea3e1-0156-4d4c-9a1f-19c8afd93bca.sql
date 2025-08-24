-- Add missing fields to submissions table for better grading workflow
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Update the status enum to include proper values if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE submission_status AS ENUM ('received', 'in_review', 'approved', 'rejected');
    ELSE
        -- Update existing enum to ensure all values are present
        ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'received';
        ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'in_review'; 
        ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'approved';
        ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'rejected';
    END IF;
END $$;

-- Create is_admin RPC function that can be called from edge functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;