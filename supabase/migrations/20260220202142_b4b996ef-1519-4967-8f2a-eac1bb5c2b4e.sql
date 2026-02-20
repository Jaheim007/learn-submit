
-- Set file size limit on submissions bucket to 50MB (52428800 bytes)
-- This prevents large files from being uploaded and causing "Failed to fetch" / timeout errors
UPDATE storage.buckets 
SET file_size_limit = 52428800
WHERE id = 'submissions';

-- Also ensure the submissions bucket has proper RLS policies for admins to view all files
-- (Check if admin read policy exists, add if not)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Admins can view all submission files'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can view all submission files"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'submissions' AND (
          public.is_admin() OR public.is_academy() OR public.is_supervisor()
        )
      )
    $policy$;
  END IF;
END;
$$;
