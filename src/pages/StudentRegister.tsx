import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Github, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import nysLogo from '@/assets/nys-logo.png';
import { AnimatedBackground } from '@/components/AnimatedBackground';

interface Class {
  id: number;
  code: string;
  title: string;
}

export default function StudentRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();


  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/etudiant/projets`
        }
      });
      
      if (error) {
        toast.error("Impossible de se connecter avec Google");
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
        toast.error("Impossible de se connecter avec GitHub");
      }
    } catch (error) {
      console.error('GitHub sign in error:', error);
    }
  };


  // If authenticated, only redirect if a student profile exists
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        navigate('/etudiant/projets', { replace: true });
      }
    };
    check();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (!fullName.trim()) {
      toast.error("Veuillez saisir votre nom complet");
      return;
    }

    setLoading(true);

    try {
      // Call the register-student edge function (no class selection - pending approval)
      const { data, error } = await supabase.functions.invoke('register-student', {
        body: {
          email,
          password,
          full_name: fullName.trim()
        }
      });

      if (error || data?.error) {
        let errorMessage = "Une erreur s'est produite lors de l'inscription";
        
        const err = error || data?.error;
        
        // Handle string errors (from edge function)
        if (typeof err === 'string') {
          errorMessage = err;
        } 
        // Handle error objects with message property
        else if (err?.message) {
          errorMessage = err.message;
        }
        // Handle FunctionsHttpError or FunctionsRelayError
        else if (error) {
          console.error('Edge function error:', error);
          errorMessage = "Erreur de connexion au serveur. Veuillez réessayer.";
        }

        toast.error(errorMessage);
        return;
      }

      toast.success("Compte créé avec succès ! Bienvenue dans NYS Submissions");

      // Sign in the user after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!signInError) {
        navigate('/etudiant/projets', { replace: true });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center p-4">
      {/* Animated Background */}
      <AnimatedBackground />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo - Clickable */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img 
              src={nysLogo} 
              alt="NYS Africa Logo" 
              className="h-16 w-16 object-contain filter drop-shadow-[0_0_20px_hsl(217,91%,60%)] cursor-pointer hover:scale-110 transition-transform"
            />
          </Link>
        </div>

        {/* Register Card */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl font-bold text-white text-center">
              Créer un Compte
            </CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Rejoignez NYS et commencez vos projets
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white h-11"
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
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-gray-400">ou avec email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="fullName" className="text-gray-300">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 focus:border-blue-500/50 focus:ring-blue-500/20"
                  disabled={loading}
                />
              </div>

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

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                Créer un compte
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400">
              Déjà un compte?{' '}
              <Link to="/etudiant/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
