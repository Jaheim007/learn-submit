import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Calendar, Send, Filter, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

interface StudentClass {
  id: number;
  code: string;
  title: string;
}

interface Project {
  id: number;
  code: string;
  title: string;
  description: string;
  due_at: string | null;
  latest_submission?: {
    id: number;
    status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
    submitted_at: string;
  } | null;
}

interface ApiState {
  data: { classes: StudentClass[]; projects: Project[] };
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export default function StudentProjects() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [apiState, setApiState] = useState<ApiState>({
    data: { classes: [], projects: [] },
    loading: true,
    error: null,
    retryCount: 0
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchStudentData();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Check for class filter in URL
    const classParam = searchParams.get('class');
    if (classParam) {
      setSelectedClassId(parseInt(classParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (apiState.data.classes.length > 0) {
      fetchProjects();
    }
  }, [selectedClassId, apiState.data.classes]);

  const fetchStudentData = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setApiState(prev => ({ ...prev, loading: true, error: null }));
      }

      console.log('🔍 Fetching student data for user:', user?.id);
      
      if (!user?.id) {
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      // First get the student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentError) {
        console.error('❌ Error fetching student:', studentError);
        throw new Error('Profil étudiant non trouvé');
      }

      if (!studentData) {
        console.log('ℹ️ No student profile found');
        setApiState(prev => ({
          ...prev,
          data: { classes: [], projects: [] },
          loading: false,
          error: null
        }));
        return;
      }

      console.log('✅ Student found:', studentData.id);

      // Then get enrollments with class information
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          class_id,
          classes!inner (
            id,
            code,
            title
          )
        `)
        .eq('student_id', studentData.id);

      if (enrollmentsError) {
        console.error('❌ Error fetching enrollments:', enrollmentsError);
        throw new Error('Impossible de récupérer vos inscriptions');
      }

      console.log('📚 Enrollments data:', enrollmentsData);

      const classesData = enrollmentsData?.map(enrollment => enrollment.classes).filter(Boolean) || [];

      console.log('🎓 Student classes:', classesData);
      
      setApiState(prev => ({
        ...prev,
        data: { classes: classesData as StudentClass[], projects: [] },
        loading: false,
        error: null,
        retryCount: 0
      }));
      
      // If there are classes, set the first one as selected by default
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id);
      }
      
    } catch (error) {
      console.error('💥 Error fetching student data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de récupérer vos projets, veuillez réessayer plus tard';
      
      setApiState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));

      // Only show toast for real server errors (not empty data cases)
      if (error instanceof Error && !error.message.includes('non trouvé')) {
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const fetchProjects = async () => {
    try {
      console.log('📝 Fetching projects...');
      
      // Get student ID first
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!studentData) return;

      // Build query based on class filter
      let classIds = apiState.data.classes.map(c => c.id);
      if (selectedClassId) {
        classIds = [selectedClassId];
      }

      if (classIds.length === 0) {
        setApiState(prev => ({
          ...prev,
          data: { ...prev.data, projects: [] }
        }));
        return;
      }

      // Get projects for the selected classes
      const { data: classProjects, error } = await supabase
        .from('class_projects')
        .select(`
          project_id,
          projects!inner (
            id,
            code,
            title,
            description,
            due_at,
            is_active
          )
        `)
        .in('class_id', classIds)
        .eq('projects.is_active', true);

      if (error) {
        console.error('❌ Error fetching projects:', error);
        throw error;
      }

      // Get unique projects
      const uniqueProjects = classProjects?.reduce((acc, item) => {
        const project = item.projects;
        if (!acc.find(p => p.id === project.id)) {
          acc.push(project);
        }
        return acc;
      }, [] as any[]) || [];

      // For each project, get the latest submission for the current class context
      const projectsWithSubmissions = await Promise.all(
        uniqueProjects.map(async (project) => {
          // Get latest submission for this project in the context of selected class(es)
          const { data: submission } = await supabase
            .from('submissions')
            .select('id, status, submitted_at')
            .eq('student_id', studentData.id)
            .eq('project_id', project.id)
            .in('class_id', classIds)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...project,
            latest_submission: submission
          };
        })
      );

      console.log('📋 Projects with submissions:', projectsWithSubmissions);
      
      setApiState(prev => ({
        ...prev,
        data: { ...prev.data, projects: projectsWithSubmissions }
      }));
    } catch (error) {
      console.error('💥 Error fetching projects:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    fetchStudentData(true);
  };

  const handleClassFilter = (classId: number | null) => {
    setSelectedClassId(classId);
    
    // Update URL params
    if (classId) {
      setSearchParams({ class: classId.toString() });
    } else {
      setSearchParams({});
    }
  };

  const handleSubmitProject = (projectId: number) => {
    if (selectedClassId) {
      navigate(`/etudiant/soumettre?project_id=${projectId}&class_id=${selectedClassId}`);
    } else if (apiState.data.classes.length === 1) {
      navigate(`/etudiant/soumettre?project_id=${projectId}&class_id=${apiState.data.classes[0].id}`);
    } else {
      toast({
        title: "Sélectionnez une classe",
        description: "Veuillez d'abord sélectionner une classe pour soumettre ce projet",
        variant: "destructive"
      });
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Loading state
  if (authLoading || apiState.loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de vos projets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state with retry option
  if (apiState.error && apiState.data.classes.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-4">Mes Projets</h1>
            <p className="text-muted-foreground mb-8">Consultez et soumettez vos projets par classe</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-yellow-800">Service temporairement indisponible</h3>
              <p className="text-yellow-700 mb-4">{apiState.error}</p>
              <div className="space-y-2">
                <Button 
                  onClick={handleRetry} 
                  disabled={apiState.loading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {apiState.loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Reconnexion...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Réessayer
                    </>
                  )}
                </Button>
                {apiState.retryCount > 2 && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Tentative {apiState.retryCount}/3 - Contactez le support si le problème persiste
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { classes, projects } = apiState.data;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-gradient-card py-12 px-4 border-b border-border">
          <div className="max-w-content mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Mes Projets
                </h1>
                <p className="text-muted-foreground">
                  Consultez et soumettez vos projets par classe
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-content mx-auto p-4 md:p-6 lg:p-8">
          {/* Class Filters */}
          {classes.length > 1 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-medium text-foreground">
                  Filtrer par classe
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedClassId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleClassFilter(null)}
                >
                  Toutes les classes
                </Button>
                {classes.map((studentClass) => (
                  <Button
                    key={studentClass.id}
                    variant={selectedClassId === studentClass.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleClassFilter(studentClass.id)}
                  >
                    {studentClass.code}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Projects List */}
          <div className="space-y-6">
            {selectedClassId && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-primary font-medium">
                  Projets pour : {classes.find(c => c.id === selectedClassId)?.title}
                </p>
              </div>
            )}

            {/* Empty States */}
            {classes.length === 0 ? (
              <Card className="card-educational">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Aucun projet disponible
                  </h3>
                  <p className="text-muted-foreground">
                    Vous n'êtes inscrit à aucune classe pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : projects.length === 0 ? (
              <Card className="card-educational">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Aucun projet dans cette classe
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedClassId 
                      ? "Aucun projet n'est assigné à cette classe pour le moment."
                      : "Aucun projet n'est encore disponible dans vos classes."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="card-educational">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">
                              {project.code}
                            </Badge>
                            {project.due_at && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>Échéance : {formatDueDate(project.due_at)}</span>
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-xl">
                            {project.title}
                          </CardTitle>
                          {project.description && (
                            <p className="text-muted-foreground">
                              {project.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          {project.latest_submission ? (
                            <div className="text-right space-y-2">
                              <StatusBadge status={project.latest_submission.status} />
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(project.latest_submission.submitted_at).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <Badge variant="secondary">
                              Aucune soumission
                            </Badge>
                          )}
                          
                          <Button
                            onClick={() => handleSubmitProject(project.id)}
                            size="sm"
                            className="btn-primary"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {project.latest_submission ? 'Nouvelle soumission' : 'Soumettre'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}