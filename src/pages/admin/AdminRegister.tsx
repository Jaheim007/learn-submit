import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated and admin
  if (user && isAdmin) {
    navigate('/admin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await signUp(email, password);

      if (error) {
        if (error.message.includes('Email already registered') || error.message.includes('already_registered')) {
          setError('Cette adresse email est déjà utilisée');
        } else if (error.message.includes('Password should be at least')) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
        } else if (error.message.includes('Invalid email')) {
          setError('Adresse email invalide');
        } else {
          setError('Erreur lors de la création du compte. Réessayez.');
        }
        return;
      }

      // After successful signup, try to promote to admin
      const { data, error: promoteError } = await supabase.functions.invoke('promote-self-to-admin');

      if (promoteError) {
        console.error('Error promoting to admin:', promoteError);
        if (promoteError.message.includes('409')) {
          setError('Un administrateur existe déjà. Veuillez vous connecter.');
          setTimeout(() => navigate('/admin/login'), 2000);
        } else {
          setError('Erreur lors de la promotion administrateur. Réessayez.');
        }
        return;
      }

      if (data?.code === 'ADMIN_EXISTS') {
        setError('Un administrateur existe déjà. Veuillez vous connecter.');
        setTimeout(() => navigate('/admin/login'), 2000);
        return;
      }

      toast.success('Compte administrateur créé avec succès !');
      // Force refresh user roles in auth context
      window.location.href = '/admin';
      
    } catch (error: any) {
      console.error('Registration error:', error);
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
            <CardTitle className="text-2xl">Créer un compte administrateur</CardTitle>
            <CardDescription>
              Créez votre compte pour accéder au système d'administration
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@nys-africa.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer mon compte
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link 
                to="/admin/login"
                className="text-sm text-primary hover:text-primary-hover transition-smooth"
              >
                Déjà un compte ? Se connecter
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}