-- Make course-materials bucket public so images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE name = 'course-materials';

-- Add policy to allow public read access to course materials
CREATE POLICY "Public read access for course materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-materials');