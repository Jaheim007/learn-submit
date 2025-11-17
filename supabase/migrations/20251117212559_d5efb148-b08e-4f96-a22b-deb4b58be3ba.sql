-- Drop the existing check constraint
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_status_check;

-- Add updated check constraint that includes 'rejected' status
ALTER TABLE students ADD CONSTRAINT students_status_check 
  CHECK (status IN ('pending', 'active', 'rejected'));