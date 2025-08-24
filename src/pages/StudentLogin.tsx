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
import { Loader2, Upload, AlertCircle, UserPlus } from 'lucide-react';
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
    navigate('/etudiant/mes-projets', { replace: true });
    return null;
  }

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
        // Check if student profile exists
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (studentError || !student) {
          // Student profile not found - sign out and show error
          await supabase.auth.signOut();
          setStudentNotFound(true);
        } else {
          // Success - redirect to dashboard
          toast({
            title: "Connexion réussie !",
            description: "Redirection en cours...",
          });
          navigate('/etudiant/mes-projets', { replace: true });
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Connexion Étudiant
              </h1>
              <p className="text-white/80 text-lg">
                Accédez à vos projets et soumissions
              </p>
            </div>
          </div>

          {/* Login Form */}
          <Card className="shadow-custom-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                Se connecter
              </CardTitle>
              <CardDescription className="text-center">
                Connectez-vous à votre compte étudiant
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {studentNotFound && (
                <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    Compte étudiant introuvable pour cet utilisateur. Veuillez créer votre compte.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-educational"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-educational"
                  />
                </div>
                
                <Button
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </form>
              
              <div className="mt-6 space-y-4">
                {studentNotFound && (
                  <Link to="/etudiant/register">
                    <Button variant="outline" className="w-full">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Créer un compte étudiant
                    </Button>
                  </Link>
                )}
                
                <div className="text-center">
                  <Link
                    to="/etudiant/register"
                    className="text-sm text-primary hover:text-primary-hover transition-smooth"
                  >
                    Pas de compte ? S'inscrire
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}