import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithClass: (email: string, password: string, classId: number) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Auto-create student profile if needed
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            createStudentProfileIfNeeded(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createStudentProfileIfNeeded = async (user: User) => {
    try {
      // Check if student profile exists
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) {
        // Create student profile
        await supabase
          .from('students')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || ''
          });
      }
    } catch (error) {
      console.error('Error creating student profile:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signUpWithClass = async (email: string, password: string, classId: number) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) return { error };
    
    // If user was created successfully, create student profile with class
    if (data.user) {
      try {
        // Create student profile with primary_class_id
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || '',
            primary_class_id: classId
          })
          .select('id')
          .single();

        if (studentError) throw studentError;

        // Create enrollment
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            student_id: studentData.id,
            class_id: classId
          });

        if (enrollmentError) throw enrollmentError;
      } catch (profileError) {
        console.error('Error creating student profile:', profileError);
        return { error: profileError };
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signUpWithClass,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}