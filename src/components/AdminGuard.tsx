import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading, isAdmin } = useAuth();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingAdminState, setCheckingAdminState] = useState(true);

  useEffect(() => {
    checkAdminState();
  }, []);

  const checkAdminState = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-state');
      
      if (error) {
        console.error('Error checking admin state:', error);
        // On error, assume no admin exists to allow setup
        setHasAdmin(false);
      } else {
        setHasAdmin(data.hasAdmin);
      }
    } catch (error) {
      console.error('Error checking admin state:', error);
      // On error, assume no admin exists to allow setup
      setHasAdmin(false);
    } finally {
      setCheckingAdminState(false);
    }
  };

  // Wait for both auth and admin state to load
  if (loading || checkingAdminState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // No admin exists - allow access to setup flow
  if (hasAdmin === false) {
    if (!user) {
      return <Navigate to="/admin/login" replace />;
    }
    // User exists but no admin in system - allow access to claim
    return <>{children}</>;
  }

  // Admin exists - check user permissions
  if (hasAdmin === true) {
    if (!user) {
      return <Navigate to="/admin/login" replace />;
    }
    if (!isAdmin) {
      return <Navigate to="/admin/claim" replace />;
    }
    // User is admin - allow access
    return <>{children}</>;
  }

  // Still loading admin state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Vérification des permissions...</p>
      </div>
    </div>
  );
}