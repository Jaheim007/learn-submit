import { Database } from '@/integrations/supabase/types';

// Extended student type with avatar_url (until Supabase types are regenerated)
export type StudentRow = Database['public']['Tables']['students']['Row'] & {
  avatar_url?: string | null;
};

export type StudentUpdate = Database['public']['Tables']['students']['Update'] & {
  avatar_url?: string | null;
};
