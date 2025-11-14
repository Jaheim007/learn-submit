-- Add image_url column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN projects.image_url IS 'URL to the project cover image in storage';