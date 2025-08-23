import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminClaim() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!user) {
    navigate('/admin/login');
    return null;
  }

  // Redirect if already admin
  if (isAdmin) {
    navigate('/admin');
    return null;
  }

  const handleClaimAdmin = async () => {
    if (!token.trim()) {
      setError('Veuillez saisir le token d\'administration');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('claim-admin', {
        body: { token: token.trim() }
      });

      if (error) {
        console.error('Error claiming admin:', error);
        
        // Handle specific error codes from the function response
        if (error.message.includes('INVALID_TOKEN') || error.message.includes('Token invalide')) {
          setError('Token invalide.');
        } else if (error.message.includes('ADMIN_ALREADY_EXISTS') || error.message.includes('Un administrateur existe déjà')) {
          setError('Un administrateur existe déjà.');
        } else {
          setError('Erreur lors de la création du compte administrateur. Réessayez.');
        }
        return;
      }

      if (data?.ok) {
        toast.success('Droits administrateur accordés avec succès !');
        
        // Force a refresh to reload auth context and roles
        window.location.href = '/admin';
      } else {
        setError('Erreur lors de la création du compte administrateur. Réessayez.');
      }
      
    } catch (error: any) {
      console.error('Unexpected error:', error);
      setError('Erreur inattendue. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-custom-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Configuration Administrateur</CardTitle>
            <CardDescription>
              Confirmez vos droits d'administration avec le token fourni
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
                Ce compte obtiendra les droits administrateur
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Token d'administration</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Saisissez le token d'administration"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Ce token vous a été fourni pour sécuriser l'accès administrateur
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleClaimAdmin}
              disabled={loading || !token.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer et devenir administrateur
            </Button>

            <div className="text-center">
              <Link 
                to="/admin/login"
                className="text-sm text-primary hover:text-primary-hover transition-smooth"
              >
                Se connecter avec un autre compte
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}