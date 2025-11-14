# Create Project Images Storage Bucket

The `project-images` bucket needs to be created manually through the Supabase Dashboard.

## Steps to create the bucket:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter bucket name: `project-images`
5. Check **"Public bucket"** (to allow public image viewing)
6. Click **"Create bucket"**

## Or run this SQL in the SQL Editor:

```sql
-- Insert the bucket (this should work if you have proper permissions)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images', 
  'project-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];
```

## RLS Policies

The following RLS policies will be automatically applied by Supabase for public buckets:

- **Admins can upload**: Users with admin role can upload images
- **Public viewing**: Everyone can view images (bucket is public)
- **Admins can delete**: Users with admin role can delete images

The policies are already coded in the application - they just need the bucket to exist!
