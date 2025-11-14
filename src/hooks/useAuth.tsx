import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Removed checkUserRole - roles are now handled by useRoles hook


  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle OAuth sign-in - create student profile if needed
        if (event === 'SIGNED_IN' && session?.user) {
          const provider = session?.user?.app_metadata?.provider;
          
          // Check if this is an OAuth login (Google, GitHub, etc.)
          if (provider && provider !== 'email') {
            console.log('OAuth sign-in detected:', provider);
            
            // Call edge function to create student profile if needed
            setTimeout(async () => {
              try {
                const { error } = await supabase.functions.invoke('handle-oauth-signup', {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`
                  }
                });
                
                if (error) {
                  console.error('Error in OAuth signup handler:', error);
                }
              } catch (err) {
                console.error('Failed to call OAuth signup handler:', err);
              }
            }, 0);
          }
        }
        
        setLoading(false);
        setAuthLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Removed auto-creation logic - students must register explicitly

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

  // Removed signUpWithClass - now handled in StudentRegister component

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
    authLoading,
    signUp,
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