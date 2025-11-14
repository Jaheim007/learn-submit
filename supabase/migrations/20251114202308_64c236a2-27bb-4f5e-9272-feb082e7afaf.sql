-- Add image_url column to course_materials table
ALTER TABLE course_materials 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN course_materials.image_url IS 'URL of the course thumbnail/header image';