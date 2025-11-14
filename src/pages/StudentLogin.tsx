import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, AlertCircle, UserPlus, Github } from 'lucide-react';
import nysLogo from '@/assets/nys-logo.png';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { supabase } from '@/integrations/supabase/client';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentNotFound, setStudentNotFound] = useState(false);
  
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (user) {
    navigate('/etudiant/projets', { replace: true });
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/etudiant/projets`
        }
      });
      
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de se connecter avec Google",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/etudiant/projets`
        }
      });
      
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de se connecter avec GitHub",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('GitHub sign in error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStudentNotFound(false);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        let errorMessage = "Une erreur s'est produite";
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Identifiants invalides";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter";
        }

        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        // Check if student profile exists using the new schema
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id)
            .eq('role', 'student')
            .single();

          if (roleError || !roleData) {
            // Student role not found - sign out and show error
            await supabase.auth.signOut();
            setStudentNotFound(true);
          } else {
            // Success - redirect to dashboard
            toast({
              title: "Connexion réussie !",
              description: "Redirection en cours...",
            });
            navigate('/etudiant/projets', { replace: true });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNavigation={false}>
      <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center p-4">
        {/* Animated Background */}
        <AnimatedBackground />

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Logo - Clickable */}
          <div className="flex justify-center mb-8">
            <img 
              src={nysLogo} 
              alt="NYS Logo" 
              className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            />
          </div>

          {/* Login Card */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl font-bold text-white text-center">
                Bienvenue
              </CardTitle>
              <CardDescription className="text-gray-400 text-center">
                Connectez-vous à votre compte
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-5">
              {studentNotFound && (
                <Alert variant="destructive" className="mb-4 bg-red-950/50 border-red-500/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun profil étudiant trouvé pour ce compte.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 focus:border-blue-500/50 focus:ring-blue-500/20"
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 focus:border-blue-500/50 focus:ring-blue-500/20"
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/50" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-gray-400">ou continuer avec</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white h-11"
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGithubSignIn}
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white h-11"
                  disabled={loading}
                >
                  <Github className="w-5 h-5 mr-2" />
                  GitHub
                </Button>
              </div>

              <p className="text-center text-sm text-gray-400">
                Pas de compte?{' '}
                <Link to="/etudiant/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  S'inscrire
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}