import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, authLoading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useRoles();
  const location = useLocation();

  // Wait for both auth and roles to finish loading
  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to admin login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated but not admin, redirect to forbidden
  if (user && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  // User is authenticated and is admin - allow access
  return <>{children}</>;
}