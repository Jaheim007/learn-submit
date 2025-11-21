-- Enable RLS policies for project-images bucket uploads
-- Allow authenticated users to upload images to project-images bucket
CREATE POLICY "Allow authenticated users to upload to project-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

-- Allow authenticated users to update their uploaded images in project-images
CREATE POLICY "Allow authenticated users to update project-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images');

-- Allow authenticated users to delete their uploaded images in project-images
CREATE POLICY "Allow authenticated users to delete project-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-images');

-- Allow public read access to project-images (since it's a public bucket)
CREATE POLICY "Allow public read access to project-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-images');