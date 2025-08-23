-- Create future project for testing submissions
INSERT INTO projects (id, code, title, description, due_at, is_active) VALUES 
  (5, 'SUBMIT-TEST', 'Test Submission Project', 'Project specifically for testing the submission workflow with file uploads and repo URLs', '2025-12-31 23:59:59+00', true);

-- Assign test project to all classes for comprehensive testing
INSERT INTO class_projects (class_id, project_id) VALUES 
  (1, 5),
  (2, 5),
  (3, 5);

-- Update storage bucket policies to ensure proper access
CREATE POLICY "Students can upload their own submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can view their own submissions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can delete their own submissions"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can update their own submissions"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);