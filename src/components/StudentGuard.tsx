import { ReactNode, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface StudentGuardProps {
  children: ReactNode;
}

export default function StudentGuard({ children }: StudentGuardProps) {
  const { user, authLoading, session } = useAuth();
  const [studentCheck, setStudentCheck] = useState<'loading' | 'found' | 'not_found' | 'rejected' | 'no_role'>('loading');
  const checkedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || authLoading || !session) return;
    if (checkedForUserRef.current === user.id && studentCheck !== 'loading') return;

    const checkStudent = async () => {
      try {
        // Check roles first
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const roleList = (roles || []).map(r => r.role);

        // If no role at all, user is pending admin approval
        if (roleList.length === 0) {
          // Ensure profile exists
          try {
            await supabase.functions.invoke('handle-oauth-signup', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
          } catch {}
          checkedForUserRef.current = user.id;
          setStudentCheck('no_role');
          return;
        }

        // If not a student role, they shouldn't be here
        if (!roleList.includes('student')) {
          checkedForUserRef.current = user.id;
          setStudentCheck('no_role');
          return;
        }

        // Check student record
        const { data: student } = await supabase
          .from('students')
          .select('id, status, is_active')
          .eq('user_id', user.id)
          .maybeSingle();

        checkedForUserRef.current = user.id;

        if (!student) {
          setStudentCheck('not_found');
        } else if (student.status === 'rejected') {
          setStudentCheck('rejected');
        } else if (student.is_active === false) {
          // Deactivated account → treat as pending until reactivated
          setStudentCheck('not_found');
        } else if (student.status === 'pending') {
          setStudentCheck('not_found');
        } else {
          setStudentCheck('found');
        }
      } catch (error) {
        console.error('Error in StudentGuard:', error);
        checkedForUserRef.current = user.id;
        setStudentCheck('not_found');
      }
    };

    checkStudent();
  }, [user?.id, authLoading, session?.access_token]);

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

  if (!user) return <Navigate to="/login" replace />;
  if (studentCheck === 'no_role') return <Navigate to="/pending" replace />;
  if (studentCheck === 'not_found') return <Navigate to="/pending" replace />;
  if (studentCheck === 'rejected') return <Navigate to="/etudiant/rejected" replace />;

  return <>{children}</>;
}
