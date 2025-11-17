import React from 'react';
import { useLocation } from 'react-router-dom';
import { ClassSelectionProvider } from './ClassSelectionProvider';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';

interface ConditionalClassSelectionProviderProps {
  children: React.ReactNode;
}

export function ConditionalClassSelectionProvider({ children }: ConditionalClassSelectionProviderProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin, isSupervisor, isLoading } = useRoles();
  
  // Don't show class selection on admin or supervisor routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSupervisorRoute = location.pathname.startsWith('/superviseur');
  const isPendingRoute = location.pathname.includes('/pending');
  
  // Don't wrap with ClassSelectionProvider if:
  // - User is not authenticated
  // - User is admin or supervisor (they don't need class selection)
  // - Roles are still loading (wait for role check)
  // - On admin/supervisor routes
  // - On pending approval page (students awaiting approval)
  if (!user || isLoading || isAdmin || isSupervisor || isAdminRoute || isSupervisorRoute || isPendingRoute) {
    return <>{children}</>;
  }
  
  return (
    <ClassSelectionProvider>
      {children}
    </ClassSelectionProvider>
  );
}