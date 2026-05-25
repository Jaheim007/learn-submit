ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS group_id uuid;
UPDATE public.tutorials SET group_id = gen_random_uuid() WHERE group_id IS NULL;
ALTER TABLE public.tutorials ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.tutorials ALTER COLUMN group_id SET DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS tutorials_group_id_idx ON public.tutorials(group_id);