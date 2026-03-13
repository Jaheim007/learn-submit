import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Github } from 'lucide-react';
import kelyaLogo from '@/assets/kelya-logo-red.jpg';
import { supabase } from '@/integrations/supabase/client';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentNotFound, setStudentNotFound] = useState(false);
  
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      supabase.from('students').select('id').eq('user_id', user.id).single()
        .then(({ data, error }) => {
          if (!error && data) navigate('/etudiant/projets', { replace: true });
        });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/etudiant/projets` }
    });
    if (error) toast({ title: "Erreur", description: "Impossible de se connecter avec Google", variant: "destructive" });
  };

  const handleGithubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/etudiant/projets` }
    });
    if (error) toast({ title: "Erreur", description: "Impossible de se connecter avec GitHub", variant: "destructive" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStudentNotFound(false);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        let errorMessage = "Une erreur s'est produite";
        if (error.message.includes('Invalid login credentials')) errorMessage = "Identifiants invalides";
        else if (error.message.includes('Email not confirmed')) errorMessage = "Veuillez confirmer votre email";
        toast({ title: "Erreur de connexion", description: errorMessage, variant: "destructive" });
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles').select('role').eq('user_id', currentUser.id).eq('role', 'student').single();
          if (roleError || !roleData) {
            await supabase.auth.signOut();
            setStudentNotFound(true);
          } else {
            toast({ title: "Connexion réussie !", description: "Redirection en cours..." });
            navigate('/etudiant/projets', { replace: true });
          }
        }
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur inattendue s'est produite", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={kelyaLogo} alt="Kelya Group" className="h-12 w-12 rounded-xl object-cover mx-auto mb-4 hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Bon retour</h1>
          <p className="text-sm text-muted-foreground mt-1">Connectez-vous à votre compte</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardContent className="pt-6">
            {studentNotFound && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Aucun profil étudiant trouvé pour ce compte.</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11 bg-secondary hover:bg-secondary-hover text-secondary-foreground font-medium" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Se connecter
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">ou</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="h-10 text-sm">
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button type="button" variant="outline" onClick={handleGithubSignIn} disabled={loading} className="h-10 text-sm">
                <Github className="w-4 h-4 mr-1.5" />
                GitHub
              </Button>
            </div>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Pas de compte ?{' '}
              <Link to="/etudiant/register" className="text-primary hover:text-primary-hover font-medium">S'inscrire</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
