import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface StudentGuardProps {
  children: ReactNode;
}

export default function StudentGuard({ children }: StudentGuardProps) {
  const { user, authLoading } = useAuth();

  // Wait for auth to finish loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to student auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated - allow access to student pages
  return <>{children}</>;
}