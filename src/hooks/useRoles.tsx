import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RolesResponse {
  roles: string[];
  isAdmin: boolean;
  isSupervisor: boolean;
  isTeacher: boolean;
  isAcademy: boolean;
  error?: string;
}

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAcademy, setIsAcademy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setIsAdmin(false);
      setIsSupervisor(false);
      setIsTeacher(false);
      setIsAcademy(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching roles for user:', user.id);
      const { data, error } = await supabase.functions.invoke('me-roles');
      
      if (error) {
        console.error('Error invoking me-roles function:', error);
        setRoles([]);
        setIsAdmin(false);
        setIsSupervisor(false);
        setIsTeacher(false);
        setIsAcademy(false);
      } else if (data?.error) {
        console.error('Error in me-roles response:', data.error);
        setRoles([]);
        setIsAdmin(false);
        setIsSupervisor(false);
        setIsTeacher(false);
        setIsAcademy(false);
      } else {
        const roleData = data as RolesResponse;
        console.log('Roles fetched successfully:', roleData);
        setRoles(roleData.roles || []);
        setIsAdmin(roleData.isAdmin || false);
        setIsSupervisor(roleData.isSupervisor || false);
        setIsTeacher(roleData.isTeacher || false);
        setIsAcademy(roleData.isAcademy || false);
      }
    } catch (error) {
      console.error('Unexpected error fetching roles:', error);
      setRoles([]);
      setIsAdmin(false);
      setIsSupervisor(false);
      setIsTeacher(false);
      setIsAcademy(false);
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
    roles,
    isAdmin,
    isSupervisor,
    isTeacher,
    isAcademy,
    isLoading,
    refetch
  };
}