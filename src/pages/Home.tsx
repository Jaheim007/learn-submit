import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Upload, ArrowRight, GraduationCap, Target, Users, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cleanClassName } from '@/lib/utils';
import nysLogo from '@/assets/nys-logo.png';
import { AnimatedBackground } from '@/components/AnimatedBackground';

interface StudentClass {
  id: number;
  code: string;
  title: string;
  description: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const { isAdmin, isSupervisor, isLoading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (user && !loading && !rolesLoading) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
        return;
      }
      if (isSupervisor) {
        navigate('/superviseur', { replace: true });
        return;
      }
      // For regular students, stay on home page to show dashboard
    }
  }, [user, loading, rolesLoading, isAdmin, isSupervisor, navigate]);

  const handleGetStarted = () => {
    if (user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/etudiant/mes-projets');
      }
    } else {
      navigate('/etudiant/login');
    }
  };

  const handleReturnHome = () => {
    if (user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/etudiant/mes-projets');
      }
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudentClasses();
    }
  }, [user]);

  const fetchStudentClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          class_id,
          classes!inner (
            id,
            code,
            title,
            description
          )
        `)
        .eq('students.user_id', user?.id);

      if (error) throw error;

      const classes = data?.map(enrollment => enrollment.classes).filter(Boolean) || [];
      setStudentClasses(classes as StudentClass[]);
    } catch (error) {
      console.error('Error fetching student classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Not authenticated - show landing page
  if (!user) {
    return (
      <Layout showNavigation={false}>
        <div className="min-h-screen relative overflow-hidden bg-black">
          {/* Animated Background */}
          <AnimatedBackground />

          {/* Hero Section - Full Width */}
          <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
            <div className="max-w-4xl mx-auto w-full">
              {/* Left Side - Hero Content */}
              <div className="space-y-8 text-center lg:text-left">
                <div className="flex justify-center lg:justify-start">
                  <img 
                    src={nysLogo} 
                    alt="NYS Logo" 
                    className="h-24 w-auto animate-fade-in"
                  />
                </div>
                
                <div className="space-y-6">
                  <h1 className="text-5xl md:text-7xl font-bold text-white animate-fade-in leading-tight">
                    Créez des
                    <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Projets Exceptionnels
                    </span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-gray-300 animate-fade-in max-w-2xl">
                    Plateforme centralisée pour la soumission et le suivi 
                    de vos projets étudiants avec vos formateurs
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                    <Button 
                      size="lg"
                      onClick={() => navigate('/etudiant/register')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
                    >
                      Créer un compte
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={() => navigate('/etudiant/login')}
                      className="text-lg px-8 py-6 rounded-xl border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
                    >
                      Se connecter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="relative py-20 px-4 bg-gradient-to-b from-transparent via-black/50 to-black">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Tout ce dont vous avez besoin
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Une solution complète pour gérer vos soumissions de projets 
                  avec vos formateurs
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="bg-gradient-to-br from-emerald-950/40 via-black/40 to-black/40 backdrop-blur-xl border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group">
                  <CardHeader>
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl text-center">Gestion Multi-Projets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-gray-300 text-center">
                      Soumettez facilement vos projets par classe avec liens, 
                      fichiers et descriptions détaillées.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-950/40 via-black/40 to-black/40 backdrop-blur-xl border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group">
                  <CardHeader>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl text-center">Suivi en Temps Réel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-gray-300 text-center">
                      Suivez le statut de vos soumissions : reçu, en révision, 
                      validé ou refusé.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-950/40 via-black/40 to-black/40 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
                  <CardHeader>
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl text-center">Communication Directe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-gray-300 text-center">
                      Profil complet avec contacts (WhatsApp, Telegram, GitHub) 
                      pour faciliter les échanges.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  // Authenticated user dashboard
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Welcome Header */}
        <section className="bg-gradient-card py-12 px-4 border-b border-border">
          <div className="max-w-content mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Tableau de bord étudiant
                </h1>
                <p className="text-muted-foreground">
                  Bienvenue ! Gérez vos projets et soumissions
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-content mx-auto p-4 md:p-6 lg:p-8">
          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="card-educational group cursor-pointer" onClick={() => navigate('/etudiant/mes-projets')}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-smooth">
                    <BookOpen className="w-5 h-5 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-primary transition-smooth">
                      Mes Projets
                    </CardTitle>
                    <CardDescription>
                      Consultez et soumettez vos projets
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="card-educational group cursor-pointer" onClick={() => navigate('/profil')}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-smooth">
                    <User className="w-5 h-5 text-secondary group-hover:text-white" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-secondary transition-smooth">
                      Mon Profil
                    </CardTitle>
                    <CardDescription>
                      Gérez vos informations personnelles
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Admin Access - shown only for actual admins */}
          {isAdmin && (
            <Card className="card-educational mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-destructive">
                        Accès Administrateur
                      </CardTitle>
                      <CardDescription>
                        Gérer les soumissions et étudiants
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate('/admin')}
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                  >
                    Dashboard Admin
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Student Classes */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Mes Classes
              </h2>
              
              {loadingClasses ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : studentClasses.length > 0 ? (
                <div className="grid gap-4">
                  {studentClasses.map((studentClass) => (
                    <Card key={studentClass.id} className="card-educational">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {cleanClassName(studentClass.title)}
                            </CardTitle>
                            <CardDescription>
                              {studentClass.description}
                            </CardDescription>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/etudiant/mes-projets?class=${studentClass.id}`)}
                          >
                            Voir projets
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="card-educational">
                  <CardContent className="py-8 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Aucune classe assignée
                    </h3>
                    <p className="text-muted-foreground">
                      Contactez votre administrateur pour être inscrit à une classe.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}