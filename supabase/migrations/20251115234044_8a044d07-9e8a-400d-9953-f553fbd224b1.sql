-- TIER 1 + 2: Security Foundation & Role Structure
-- =================================================

-- 1. Add status column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
CHECK (status IN ('pending', 'active', 'inactive', 'suspended'));

-- Set all existing students to active (no disruption)
UPDATE public.students SET status = 'active' WHERE status IS NULL OR status = '';

-- 2. Add academy role support
-- Note: Keeping 'supervisor' in enum for backwards compatibility during transition
-- Will be fully migrated to 'teacher' in code

-- 3. Add job_postings table for job board
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT,
  location TEXT,
  job_type TEXT, -- full-time, part-time, internship, freelance
  posted_by UUID NOT NULL, -- admin or academy user who posted
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on job_postings
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- RLS: Students can view active job postings
CREATE POLICY "Students can view active job postings"
ON public.job_postings
FOR SELECT
USING (is_active = true);

-- RLS: Admins and academy can manage job postings
CREATE POLICY "Admins and academy can manage job postings"
ON public.job_postings
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 4. Add updated_at trigger for job_postings
CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Add index on student status for faster queries
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

-- 6. Add index on job_postings for active jobs
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON public.job_postings(is_active, created_at DESC);