import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, Users, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Class {
  id: number;
  code: string;
  title: string;
}

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { signUp, signUpWithClass, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignUp) {
      fetchClasses();
    }
  }, [isSignUp]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, code, title')
        .in('code', ['G1', 'G2', 'G3', 'G4', 'G5'])
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  // Redirect if already authenticated
  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (isSignUp && !selectedClassId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner votre groupe de classe",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUpWithClass(email, password, parseInt(selectedClassId))
        : await signIn(email, password);

      if (error) {
        let errorMessage = "Une erreur s'est produite";
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Identifiants invalides";
        } else if (error.message.includes('Email already registered')) {
          errorMessage = "Cette adresse email est déjà utilisée";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
        }

        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        if (isSignUp) {
          toast({
            title: "Compte créé !",
            description: "Vérifiez votre email pour confirmer votre compte",
          });
        } else {
          toast({
            title: "Connexion réussie !",
            description: "Redirection en cours...",
          });
          navigate('/');
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
                NYS Submissions Portal
              </h1>
              <p className="text-white/80 text-lg">
                Plateforme de soumission de projets étudiants
              </p>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-1 gap-3 mt-6 text-white/90">
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Gestion multi-projets et multi-classes</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Upload className="w-4 h-4" />
                <span>Upload sécurisé de fichiers</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4" />
                <span>Suivi personnalisé par formateur</span>
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <Card className="shadow-custom-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignUp 
                  ? 'Rejoignez votre promotion et commencez à soumettre vos projets'
                  : 'Accédez à vos projets et soumissions'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
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
                
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="input-educational"
                    />
                  </div>
                )}

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="class-select">Choisissez votre groupe de classe</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger className="input-educational">
                        <SelectValue placeholder="Sélectionnez votre groupe..." />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Sélectionnez votre groupe. Ce choix est définitif.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                <Button
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-primary hover:text-primary-hover transition-smooth"
                >
                  {isSignUp 
                    ? 'Déjà un compte ? Se connecter' 
                    : 'Pas de compte ? S\'inscrire'
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}