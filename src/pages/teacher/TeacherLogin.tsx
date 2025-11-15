import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Users } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import nysLogo from '@/assets/nys-logo.png';

export default function TeacherLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user, authLoading } = useAuth();
  const { isTeacher, isLoading: rolesLoading, refetch: refetchRoles } = useRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !rolesLoading && user && isTeacher) {
      navigate('/teacher', { replace: true });
    }
  }, [user, isTeacher, authLoading, rolesLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);
      
      if (error) {
        console.error('Login error:', error);
        
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('Email ou mot de passe incorrect');
        } else if (error.message?.includes('Email not confirmed')) {
          toast.error('Veuillez confirmer votre email avant de vous connecter');
        } else {
          toast.error(error.message || 'Erreur lors de la connexion');
        }
        return;
      }

      await supabase.auth.refreshSession();
      await refetchRoles();
      toast.success('Connexion réussie');
      
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast.error('Erreur inattendue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && !isTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Accès non autorisé</CardTitle>
            <CardDescription>
              Cette zone est réservée aux formateurs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center px-4">
      <AnimatedBackground />
      
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={nysLogo} alt="NYS Africa" className="h-16 w-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl">Portail Formateurs</CardTitle>
            <CardDescription>
              Accédez à votre espace formateur
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@nys-africa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
