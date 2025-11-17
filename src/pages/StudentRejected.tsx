import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, LogOut } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import nysLogo from '@/assets/nys-logo.png';

export default function StudentRejected() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
              <img src={nysLogo} alt="Logo" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Accès non autorisé</CardTitle>
            <CardDescription>
              Votre demande d'inscription n'a pas été approuvée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center space-y-4">
              <XCircle className="h-16 w-16 mx-auto text-destructive" />
              <div className="space-y-2">
                <p className="font-medium text-destructive">Compte désactivé</p>
                <p className="text-sm text-muted-foreground">
                  Malheureusement, votre demande d'accès à cette plateforme n'a pas été approuvée par l'administration. 
                  Votre compte a été désactivé et vous ne pouvez plus accéder aux services.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Connecté en tant que: <span className="font-medium text-foreground">{user?.email}</span>
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Si vous pensez qu'il s'agit d'une erreur ou souhaitez plus d'informations, 
                veuillez contacter l'administration de la plateforme.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
