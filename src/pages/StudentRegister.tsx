import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, AlertCircle, BookOpen, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, code, title, session_name')
        .eq('is_open_for_signup', true)
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
    navigate('/etudiant/mes-projets', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (!selectedClassId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner votre groupe de classe",
        variant: "destructive"
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre nom complet",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Call the register-student edge function
      const { data, error } = await supabase.functions.invoke('register-student', {
        body: {
          email,
          password,
          full_name: fullName.trim(),
          class_id: selectedClassId
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

        toast({
          title: "Erreur d'inscription",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Compte créé avec succès !",
        description: "Bienvenue dans NYS Submissions",
      });

      // Sign in the user after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!signInError) {
        navigate('/etudiant/mes-projets', { replace: true });
      }
    } catch (error) {
      console.error('Registration error:', error);
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
                Inscription Étudiant
              </h1>
              <p className="text-white/80 text-lg">
                Rejoignez votre promotion NYS-Africa
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

          {/* Registration Form */}
          <Card className="shadow-custom-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                Créer un compte
              </CardTitle>
              <CardDescription className="text-center">
                Rejoignez votre promotion et commencez à soumettre vos projets
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Votre nom complet"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="input-educational"
                  />
                </div>

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
                    minLength={6}
                    className="input-educational"
                  />
                  <p className="text-xs text-muted-foreground">
                    Doit contenir : majuscules, minuscules, chiffres et symboles
                  </p>
                </div>
                
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

                <div className="space-y-2">
                  <Label htmlFor="class-select">Choisissez votre groupe</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="input-educational">
                      <SelectValue placeholder={classes.length > 0 ? "Sélectionnez votre groupe..." : "Aucun groupe ouvert aux inscriptions"} />
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
                      {classes.length > 0 
                        ? "Choisissez votre groupe. Ce choix est définitif."
                        : "Aucun groupe ouvert aux inscriptions pour le moment."
                      }
                    </AlertDescription>
                  </Alert>
                </div>
                
                <Button
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer mon compte
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <Link
                  to="/etudiant/login"
                  className="text-sm text-primary hover:text-primary-hover transition-smooth"
                >
                  Déjà un compte ? Se connecter
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}