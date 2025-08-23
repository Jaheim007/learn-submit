import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, User } from 'lucide-react';

interface AdminSetupWizardProps {
  onSuccess: () => void;
}

export default function AdminSetupWizard({ onSuccess }: AdminSetupWizardProps) {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClaimAdmin = async () => {
    if (!token.trim()) {
      toast.error('Veuillez saisir le token d\'administration');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('claim-admin', {
        body: { token: token.trim() }
      });

      if (error) {
        console.error('Error claiming admin:', error);
        if (error.message.includes('Invalid token')) {
          toast.error('Token d\'administration invalide');
        } else if (error.message.includes('Admin already exists')) {
          toast.error('Un administrateur existe déjà');
        } else {
          toast.error('Erreur lors de la création du compte administrateur');
        }
        return;
      }

      toast.success('Compte administrateur créé avec succès !');
      onSuccess();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('Erreur inattendue lors de la création du compte administrateur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Configuration Administrateur</CardTitle>
            <CardDescription>
              Créer le premier compte administrateur du système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Utilisateur connecté</Label>
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ce compte deviendra administrateur du système
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Token d'administration</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Saisissez le token d'administration"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Ce token vous a été fourni pour sécuriser la création du premier administrateur
              </p>
            </div>

            <Button 
              onClick={handleClaimAdmin}
              disabled={isLoading || !token.trim()}
              className="w-full"
            >
              {isLoading ? 'Création en cours...' : 'Devenir Administrateur'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}