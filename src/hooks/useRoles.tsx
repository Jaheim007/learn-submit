import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RolesResponse {
  roles: string[];
  isAdmin: boolean;
  isSupervisor: boolean;
  error?: string;
}

export function useRoles() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsSupervisor(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching roles for user:', user.id);
      const { data, error } = await supabase.functions.invoke('me-roles');
      
      if (error) {
        console.error('Error invoking me-roles function:', error);
        setIsAdmin(false);
        setIsSupervisor(false);
      } else if (data?.error) {
        console.error('Error in me-roles response:', data.error);
        setIsAdmin(false);
        setIsSupervisor(false);
      } else {
        const roleData = data as RolesResponse;
        console.log('Roles fetched successfully:', roleData);
        setIsAdmin(roleData.isAdmin || false);
        setIsSupervisor(roleData.isSupervisor || false);
      }
    } catch (error) {
      console.error('Unexpected error fetching roles:', error);
      setIsAdmin(false);
      setIsSupervisor(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refetch = useCallback(async () => {
    console.log('Refetching roles...');
    await fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    isAdmin,
    isSupervisor,
    isLoading,
    refetch
  };
}