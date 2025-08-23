-- Add grade and feedback columns to submissions table
ALTER TABLE public.submissions 
ADD COLUMN grade DECIMAL(4,2) CHECK (grade >= 0 AND grade <= 20),
ADD COLUMN feedback TEXT;

-- Create comment for grade column
COMMENT ON COLUMN public.submissions.grade IS 'Grade on scale 0-20, with 2 decimal precision';

-- Create index for better performance when filtering by grade
CREATE INDEX idx_submissions_grade ON public.submissions(grade) WHERE grade IS NOT NULL;