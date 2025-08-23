import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, authLoading, isAdmin } = useAuth();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingAdminState, setCheckingAdminState] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAdminState();
  }, []);

  useEffect(() => {
    // Auto-promotion logic - only run when conditions change
    if (hasAdmin === false && user && !isAdmin && !promoting) {
      attemptSelfPromotion();
    }
  }, [hasAdmin, user, isAdmin, promoting]);

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

  const attemptSelfPromotion = async () => {
    if (!user || promoting) return;
    
    setPromoting(true);
    try {
      const { data, error } = await supabase.functions.invoke('promote-self-to-admin');
      
      if (error) {
        console.error('Error promoting to admin:', error);
        return false;
      }

      if (data?.code === 'ADMIN_EXISTS') {
        return false;
      }

      // Success - force page reload to refresh auth context
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Error promoting to admin:', error);
      return false;
    } finally {
      setPromoting(false);
    }
  };

  // Show loading while auth or admin state is loading
  if (authLoading || checkingAdminState || promoting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            {promoting ? 'Configuration du compte administrateur...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  // Allow admin registration page when no admin exists
  if (hasAdmin === false && location.pathname === '/admin/register') {
    return <>{children}</>;
  }

  // No admin exists and user is authenticated - show loading while auto-promotion happens
  if (hasAdmin === false && user && !isAdmin && location.pathname !== '/admin/register') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Configuration du compte administrateur...</p>
        </div>
      </div>
    );
  }

  // No admin exists but no user - redirect to register
  if (hasAdmin === false && !user) {
    return <Navigate to="/admin/register" replace />;
  }

  // Admin exists - check user permissions
  if (hasAdmin === true) {
    if (!user) {
      return <Navigate to="/admin/login" replace />;
    }
    if (!isAdmin) {
      return <Navigate to="/forbidden" replace />;
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