import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface StudentGuardProps {
  children: ReactNode;
}

export default function StudentGuard({ children }: StudentGuardProps) {
  const { user, authLoading, session } = useAuth();
  const [studentCheck, setStudentCheck] = useState<'loading' | 'found' | 'not_found'>('loading');

  // Ensure student profile exists (handles OAuth auto-provisioning)
  useEffect(() => {
    if (!user || authLoading || !session) return;

    const ensureStudentProfile = async () => {
      try {
        // 1) Fast path: does a student profile already exist?
        const { data: studentData, error: studentErr } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!studentErr && studentData) {
          setStudentCheck('found');
          return;
        }

        // 2) If not found and this is an OAuth user, auto-create via edge function
        const provider = session?.user?.app_metadata?.provider;
        if (provider && provider !== 'email') {
          setStudentCheck('loading');
          try {
            const { error: fnErr } = await supabase.functions.invoke('handle-oauth-signup', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });
            if (fnErr) {
              console.error('handle-oauth-signup error:', fnErr);
            }
          } catch (e) {
            console.error('Failed invoking handle-oauth-signup:', e);
          }

          // Re-check after invoking
          const { data: afterData, error: afterErr } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!afterErr && afterData) {
            setStudentCheck('found');
            return;
          }
        }

        // 3) Still not found -> require registration (email/password path)
        setStudentCheck('not_found');
      } catch (error) {
        console.error('Error ensuring student profile:', error);
        setStudentCheck('not_found');
      }
    };

    ensureStudentProfile();
  }, [user, authLoading, session]);

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