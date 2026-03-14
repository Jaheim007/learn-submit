import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface RolesResponse {
  roles: string[];
  isAdmin: boolean;
  isSupervisor: boolean;
  isTeacher: boolean;
  isAcademy: boolean;
  error?: string;
}

const fetchUserRoles = async (): Promise<RolesResponse> => {
  const { data, error } = await supabase.functions.invoke('me-roles');
  
  if (error || data?.error) {
    console.error('Error fetching roles:', error || data?.error);
    return { roles: [], isAdmin: false, isSupervisor: false, isTeacher: false, isAcademy: false };
  }
  
  return {
    roles: data.roles || [],
    isAdmin: data.isAdmin || false,
    isSupervisor: data.isSupervisor || false,
    isTeacher: data.isTeacher || false,
    isAcademy: data.isAcademy || false,
  };
};

export function useRoles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: fetchUserRoles,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes — avoid redundant calls across guards
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user-roles', user?.id] });
  }, [queryClient, user?.id]);

  return {
    roles: data?.roles ?? [],
    isAdmin: data?.isAdmin ?? false,
    isSupervisor: data?.isSupervisor ?? false,
    isTeacher: data?.isTeacher ?? false,
    isAcademy: data?.isAcademy ?? false,
    isLoading: !!user && isLoading,
    refetch,
  };
}
