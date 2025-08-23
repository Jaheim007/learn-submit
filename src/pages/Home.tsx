import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Upload, ArrowRight, GraduationCap, Target, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StudentClass {
  id: number;
  code: string;
  title: string;
  description: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

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
        <div className="min-h-screen">
          {/* Hero Section */}
          <section className="bg-gradient-hero py-20 px-4">
            <div className="max-w-content mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                  <Upload className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                NYS Submissions Portal
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
                Plateforme centralisée pour la soumission et le suivi 
                de vos projets étudiants
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="btn-primary text-lg px-8 py-3"
                >
                  Se connecter
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="btn-outline text-lg px-8 py-3 border-white/30 text-white hover:bg-white hover:text-primary"
                >
                  Créer un compte
                </Button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 px-4 bg-background">
            <div className="max-w-content mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Tout ce dont vous avez besoin
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Une solution complète pour gérer vos soumissions de projets 
                  avec vos formateurs
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="card-educational text-center">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Gestion Multi-Projets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Soumettez facilement vos projets par classe avec liens, 
                      fichiers et descriptions détaillées.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="card-educational text-center">
                  <CardHeader>
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6 text-secondary" />
                    </div>
                    <CardTitle>Suivi en Temps Réel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Suivez le statut de vos soumissions : reçu, en révision, 
                      validé ou refusé.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="card-educational text-center">
                  <CardHeader>
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-success" />
                    </div>
                    <CardTitle>Communication Directe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
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
                              {studentClass.code} - {studentClass.title}
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