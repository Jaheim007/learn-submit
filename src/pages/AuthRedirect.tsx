import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Card } from '@/components/ui/card';

// Simple post-auth routing hub
// Decides where to send the user after any auth flow (OAuth or email/password)
export default function AuthRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const route = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        navigate('/signin', { replace: true });
        return;
      }

      // Find one organization membership for this user and check onboarding flag
      const { data: memberships, error } = await supabase
        .from('submito_organization_users')
        .select('organization_id, submito_organizations ( onboarding_completed )')
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        // On error, send to landing to avoid loops
        navigate('/', { replace: true });
        return;
      }

      const onboardingCompleted = memberships?.[0]?.submito_organizations?.onboarding_completed;

      if (onboardingCompleted) {
        navigate('/organization/dashboard', { replace: true });
      } else {
        // If the user has no org or hasn't completed onboarding yet
        navigate('/onboarding', { replace: true });
      }
    };

    // Run immediately
    route();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12">
      <AnimatedBackground />
      <Card className="w-full max-w-md p-10 bg-card/40 backdrop-blur-2xl border-2 border-border/30 shadow-2xl rounded-3xl text-center">
        <p className="text-muted-foreground">Checking your workspace...</p>
      </Card>
    </div>
  );
}
