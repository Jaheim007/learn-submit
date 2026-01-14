import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Track if we've already fetched roles for this user to avoid re-fetching
  const fetchedForUserRef = useRef<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchRoles = useCallback(async (forceRefetch = false) => {
    if (!user) {
      setRoles([]);
      setIsAdmin(false);
      setIsSupervisor(false);
      setIsTeacher(false);
      setIsAcademy(false);
      setIsLoading(false);
      fetchedForUserRef.current = null;
      hasFetchedRef.current = false;
      return;
    }

    // Skip refetch if we already have roles for this user (unless forced)
    if (!forceRefetch && hasFetchedRef.current && fetchedForUserRef.current === user.id) {
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
        
        // Mark that we've successfully fetched for this user
        fetchedForUserRef.current = user.id;
        hasFetchedRef.current = true;
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
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const refetch = useCallback(async () => {
    console.log('Refetching roles...');
    await fetchRoles(true); // Force refetch
  }, [fetchRoles]);

  useEffect(() => {
    // Only fetch if user ID changed
    if (user?.id !== fetchedForUserRef.current) {
      fetchRoles();
    } else if (!user) {
      // Reset if user logged out
      fetchRoles();
    }
  }, [user?.id, fetchRoles]);

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