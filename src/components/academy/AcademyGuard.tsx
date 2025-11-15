import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Navigate } from 'react-router-dom';

interface AcademyGuardProps {
  children: ReactNode;
}

export default function AcademyGuard({ children }: AcademyGuardProps) {
  const { user, authLoading } = useAuth();
  const { roles, isLoading: rolesLoading } = useRoles();

  const isAcademy = roles.includes('academy');

  // Wait for both auth and roles to finish loading
  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to academy login
  if (!user) {
    return <Navigate to="/academy/login" replace />;
  }

  // If authenticated and is academy, allow access
  if (user && isAcademy) {
    return <>{children}</>;
  }

  // If authenticated but not academy, redirect to forbidden
  return <Navigate to="/forbidden" replace />;
}
