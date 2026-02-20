-- Add file_urls text[] column to submissions to support unlimited file uploads
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS file_urls text[] DEFAULT '{}';

-- Migrate existing file1_url, file2_url, file3_url data into file_urls array
UPDATE public.submissions
SET file_urls = ARRAY_REMOVE(ARRAY[file1_url, file2_url, file3_url], NULL)
WHERE file_urls = '{}' AND (file1_url IS NOT NULL OR file2_url IS NOT NULL OR file3_url IS NOT NULL);
