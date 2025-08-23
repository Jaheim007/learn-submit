import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RolesResponse {
  roles: string[];
  isAdmin: boolean;
  isSupervisor: boolean;
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
      const { data, error } = await supabase.functions.invoke('me-roles');
      
      if (error) {
        console.error('Error fetching roles:', error);
        setIsAdmin(false);
        setIsSupervisor(false);
      } else {
        const roleData = data as RolesResponse;
        setIsAdmin(roleData.isAdmin);
        setIsSupervisor(roleData.isSupervisor);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setIsAdmin(false);
      setIsSupervisor(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refetch = useCallback(async () => {
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