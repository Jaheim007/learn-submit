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
          {/* Animated Background with Glow Effect */}
          <div className="absolute inset-0">
            {/* Main gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-black"></div>
            
            {/* Glowing orb effect - top right */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/30 rounded-full blur-[120px] animate-pulse"></div>
            
            {/* Glowing orb effect - bottom left */}
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            {/* Floating particles */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${5 + Math.random() * 10}s`
                  }}
                />
              ))}
            </div>
            
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000,transparent)]"></div>
          </div>

          {/* Hero Section - Split Layout */}
          <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
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
                      Commencer Gratuitement
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

              {/* Right Side - Auth Preview Card */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md">
                  <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
                    <CardHeader className="space-y-1 pb-4">
                      <CardTitle className="text-2xl font-bold text-white text-center">
                        Bienvenue
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-center">
                        Connectez-vous à votre compte
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="preview-email" className="text-gray-300">Email</Label>
                        <Input
                          id="preview-email"
                          type="email"
                          placeholder="etudiant@example.com"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12"
                          disabled
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="preview-password" className="text-gray-300">Mot de passe</Label>
                        <Input
                          id="preview-password"
                          type="password"
                          placeholder="••••••••"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12"
                          disabled
                        />
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white h-12 rounded-lg"
                        disabled
                      >
                        Se connecter
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-transparent px-2 text-gray-400">ou</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                          disabled
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
                          variant="outline"
                          className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                          disabled
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          GitHub
                        </Button>
                      </div>

                      <p className="text-center text-sm text-gray-400">
                        Pas de compte?{' '}
                        <span className="text-blue-400 hover:text-blue-300 cursor-pointer">
                          S'inscrire
                        </span>
                      </p>
                    </CardContent>
                  </Card>
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