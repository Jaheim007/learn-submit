import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'processing' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('Validation de votre invitation...');

  const token = searchParams.get('token') || searchParams.get('invitation_token');

  useEffect(() => {
    const processInvitation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Lien d\'invitation invalide.');
        toast.error("Lien d'invitation invalide");
        navigate('/organization/signin');
        return;
      }

      try {
        setStatus('processing');
        setMessage('Activation de votre accès à l\'organisation...');

        const { error } = await supabase.functions.invoke('accept-organization-invitation', {
          body: { token },
        });

        if (error) {
          console.error('Error from edge function:', error);
          setStatus('error');
          setMessage(error.message || 'Impossible de valider votre invitation.');
          toast.error(error.message || 'Impossible de valider votre invitation.');
          navigate('/organization/signin');
          return;
        }

        setStatus('success');
        setMessage('Invitation acceptée avec succès. Redirection vers le tableau de bord...');
        toast.success('Invitation acceptée, bienvenue sur Submito !');

        setTimeout(() => {
          navigate('/organization/dashboard');
        }, 1500);
      } catch (err: any) {
        console.error('Unexpected error processing invitation:', err);
        setStatus('error');
        setMessage('Une erreur est survenue lors du traitement de votre invitation.');
        toast.error('Une erreur est survenue lors du traitement de votre invitation.');
        navigate('/organization/signin');
      }
    };

    processInvitation();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <AnimatedBackground />
      <Card className="w-full max-w-md relative z-10 bg-card/90 backdrop-blur-xl border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Confirmation d\'invitation</CardTitle>
          <CardDescription>
            Nous finalisons la configuration de votre accès à l\'organisation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {(status === 'verifying' || status === 'processing') && (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
          <p className="text-sm text-muted-foreground text-center">{message}</p>
          {status === 'error' && (
            <Button variant="outline" onClick={() => navigate('/organization/signin')}>
              Retour à la connexion
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
