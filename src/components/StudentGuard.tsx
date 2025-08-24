import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface StudentGuardProps {
  children: ReactNode;
}

export default function StudentGuard({ children }: StudentGuardProps) {
  const { user, authLoading } = useAuth();
  const [studentCheck, setStudentCheck] = useState<'loading' | 'found' | 'not_found'>('loading');

  // Check if user has student profile
  useEffect(() => {
    if (!user || authLoading) return;

    const checkStudentProfile = async () => {
      try {
        const { data: student, error } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error || !student) {
          setStudentCheck('not_found');
        } else {
          setStudentCheck('found');
        }
      } catch (error) {
        console.error('Error checking student profile:', error);
        setStudentCheck('not_found');
      }
    };

    checkStudentProfile();
  }, [user, authLoading]);

  // Wait for auth to finish loading
  if (authLoading || studentCheck === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to student login
  if (!user) {
    return <Navigate to="/etudiant/login" replace />;
  }

  // If authenticated but no student profile, redirect to registration
  if (studentCheck === 'not_found') {
    return <Navigate to="/etudiant/register" replace state={{ message: "Vous devez d'abord créer votre profil étudiant." }} />;
  }

  // User is authenticated and has student profile - allow access
  return <>{children}</>;
}