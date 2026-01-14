import { ReactNode, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface StudentGuardProps {
  children: ReactNode;
}

export default function StudentGuard({ children }: StudentGuardProps) {
  const { user, authLoading, session } = useAuth();
  const [studentCheck, setStudentCheck] = useState<'loading' | 'found' | 'not_found' | 'rejected'>('loading');
  
  // Track if we've already checked for this user to avoid re-checking on tab switch
  const checkedForUserRef = useRef<string | null>(null);

  // Ensure student profile exists (handles OAuth auto-provisioning)
  useEffect(() => {
    if (!user || authLoading || !session) return;
    
    // Skip if we've already checked for this user
    if (checkedForUserRef.current === user.id && studentCheck !== 'loading') {
      return;
    }

    const ensureStudentProfile = async () => {
      try {
        // 1) Fast path: does a student profile already exist?
        const { data: studentData, error: studentErr } = await supabase
          .from('students')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!studentErr && studentData) {
          checkedForUserRef.current = user.id;
          // Check student status
          if (studentData.status === 'pending') {
            setStudentCheck('not_found'); // Will redirect to pending page
            return;
          }
          if (studentData.status === 'rejected') {
            setStudentCheck('rejected'); // Will redirect to rejected page
            return;
          }
          setStudentCheck('found');
          return;
        }

        // 2) If not found and this is an OAuth user, auto-create via edge function
        const provider = session?.user?.app_metadata?.provider;
        if (provider && provider !== 'email') {
          try {
            // 2a) Try direct insert (works if RLS allows creating own student row)
            const { data: created, error: insertErr } = await supabase
              .from('students')
              .insert({
                user_id: user.id,
                email: user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
                is_active: true,
              })
              .select('id')
              .single();

            if (!insertErr && created) {
              checkedForUserRef.current = user.id;
              setStudentCheck('found');
              return;
            }

            // 2b) Fallback to edge function with user JWT (bypasses RLS via service role)
            const { error: fnErr } = await supabase.functions.invoke('handle-oauth-signup', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });
            if (fnErr) {
              console.error('handle-oauth-signup error:', fnErr);
            }
          } catch (e) {
            console.error('Failed creating OAuth student profile:', e);
          }

          // Re-check after attempting creation
          const { data: afterData, error: afterErr } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!afterErr && afterData) {
            checkedForUserRef.current = user.id;
            setStudentCheck('found');
            return;
          }
        }

        // 3) Still not found -> require registration (email/password path)
        checkedForUserRef.current = user.id;
        setStudentCheck('not_found');
      } catch (error) {
        console.error('Error ensuring student profile:', error);
        checkedForUserRef.current = user.id;
        setStudentCheck('not_found');
      }
    };

    ensureStudentProfile();
  }, [user?.id, authLoading, session?.access_token]); // Only re-run if user ID actually changes

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

  // If authenticated but no student profile or pending approval, redirect
  if (studentCheck === 'not_found') {
    return <Navigate to="/etudiant/pending" replace />;
  }

  // If student account is rejected, redirect to rejected page
  if (studentCheck === 'rejected') {
    return <Navigate to="/etudiant/rejected" replace />;
  }

  // User is authenticated and has student profile - allow access
  return <>{children}</>;
}