-- Add course_group_id to group multiple files under one course
ALTER TABLE public.course_materials 
ADD COLUMN course_group_id uuid DEFAULT gen_random_uuid();

-- Create index for better query performance
CREATE INDEX idx_course_materials_group_id ON public.course_materials(course_group_id);