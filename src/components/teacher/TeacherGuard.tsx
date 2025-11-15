import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Navigate } from 'react-router-dom';

interface TeacherGuardProps {
  children: ReactNode;
}

export default function TeacherGuard({ children }: TeacherGuardProps) {
  const { user, authLoading } = useAuth();
  const { isTeacher, isLoading: rolesLoading } = useRoles();

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

  if (!user) {
    return <Navigate to="/teacher/login" replace />;
  }

  if (user && isTeacher) {
    return <>{children}</>;
  }

  return <Navigate to="/forbidden" replace />;
}
