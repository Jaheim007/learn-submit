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
      // Sign up with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/etudiant/login`,
          data: {
            full_name: fullName.trim()
          }
        }
      });

      if (error) {
        let errorMessage = "Une erreur s'est produite";
        
        if (error.message.includes('User already registered')) {
          errorMessage = "Cette adresse email est déjà utilisée";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Adresse email invalide";
        }

        toast({
          title: "Erreur d'inscription",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      // If user was created and we have a session, create the student profile
      if (data.user && data.session) {
        try {
          // Create student profile
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              full_name: fullName.trim(),
              primary_class_id: parseInt(selectedClassId)
            });

          if (studentError) throw studentError;

          // Create enrollment
          const { error: enrollmentError } = await supabase
            .from('enrollments')
            .insert({
              student_id: data.user.id, // Will be replaced by student.id from trigger
              class_id: parseInt(selectedClassId)
            });

          if (enrollmentError) {
            console.warn('Enrollment creation failed, but student profile was created:', enrollmentError);
          }

          toast({
            title: "Compte créé avec succès !",
            description: "Bienvenue ! Redirection en cours...",
          });

          // Redirect to student dashboard
          navigate('/etudiant/mes-projets', { replace: true });
        } catch (profileError) {
          console.error('Error creating student profile:', profileError);
          
          // Clean up auth user if profile creation fails
          await supabase.auth.signOut();
          
          toast({
            title: "Erreur de création du profil",
            description: "Veuillez réessayer ou contacter l'administration",
            variant: "destructive"
          });
        }
      } else {
        // Email confirmation required
        toast({
          title: "Inscription réussie !",
          description: "Vérifiez votre email pour confirmer votre compte, puis connectez-vous",
        });
        navigate('/etudiant/login');
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
                      Sélectionnez votre groupe. Ce choix est définitif après l'inscription.
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