import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import nysLogo from '@/assets/nys-logo.png';

export default function StudentPending() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const checkApprovalStatus = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      const { data } = await supabase
        .from('students')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (data?.status === 'active') {
        navigate('/etudiant/projets', { replace: true });
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/etudiant/login');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-background/40 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={nysLogo} alt="NYS Logo" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Compte en attente d'approbation</CardTitle>
            <CardDescription>
              Votre inscription a été reçue avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 text-center space-y-4">
              <Clock className="h-16 w-16 mx-auto text-yellow-500 animate-pulse" />
              <div className="space-y-2">
                <p className="font-medium">Votre compte est en cours de vérification</p>
                <p className="text-sm text-muted-foreground">
                  L'administration doit approuver votre compte et vous assigner à vos classes. 
                  Vous recevrez une notification une fois que votre compte sera activé.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Connecté en tant que: <span className="font-medium text-foreground">{user?.email}</span>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={checkApprovalStatus}
                disabled={checking}
                className="w-full"
              >
                {checking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Vérifier le statut
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </Button>
            </div>

            <div className="text-xs text-center text-muted-foreground">
              Ce processus prend généralement 24-48 heures. Si vous avez des questions, contactez l'administration.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
