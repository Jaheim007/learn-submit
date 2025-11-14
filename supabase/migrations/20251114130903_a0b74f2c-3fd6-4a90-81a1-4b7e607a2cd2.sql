-- Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- Policies for avatars bucket
-- Public read
create policy "Avatar public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

-- Authenticated users can upload/update/delete their own avatar in a folder named with their auth.uid()
create policy "Users upload avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policies for submissions bucket (private)
-- Students can upload files under a folder named with their students.id (UUID), which maps from auth.uid()
create policy "Students upload submission files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'submissions'
    and exists (
      select 1 from public.students s
      where s.user_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  );

-- Students can read their own submission files
create policy "Students read own submission files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'submissions'
    and exists (
      select 1 from public.students s
      where s.user_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  );

-- Students can update their own submission files (not strictly needed but useful for replacements)
create policy "Students update own submission files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'submissions'
    and exists (
      select 1 from public.students s
      where s.user_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'submissions'
    and exists (
      select 1 from public.students s
      where s.user_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  );