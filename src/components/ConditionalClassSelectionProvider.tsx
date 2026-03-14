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
  const { isAdmin, isSupervisor, isTeacher, isAcademy, isLoading } = useRoles();
  
  // Don't show class selection on non-student routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSupervisorRoute = location.pathname.startsWith('/superviseur');
  const isTeacherRoute = location.pathname.startsWith('/teacher');
  const isAcademyRoute = location.pathname.startsWith('/academy');
  const isPendingRoute = location.pathname.includes('/pending');
  const isRejectedRoute = location.pathname.includes('/rejected');
  
  // Don't wrap with ClassSelectionProvider if user is not a student
  if (!user || isLoading || isAdmin || isSupervisor || isTeacher || isAcademy || isAdminRoute || isSupervisorRoute || isTeacherRoute || isAcademyRoute || isPendingRoute || isRejectedRoute) {
    return <>{children}</>;
  }
  
  return (
    <ClassSelectionProvider>
      {children}
    </ClassSelectionProvider>
  );
}