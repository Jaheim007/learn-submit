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
import { BookOpen, Calendar, Send, Filter, Clock } from 'lucide-react';

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

export default function StudentProjects() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchStudentClasses();
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
    if (studentClasses.length > 0) {
      fetchProjects();
    }
  }, [selectedClassId, studentClasses]);

  const fetchStudentClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          class_id,
          classes!inner (
            id,
            code,
            title
          )
        `)
        .eq('students.user_id', user?.id);

      if (error) throw error;

      const classes = data?.map(enrollment => enrollment.classes).filter(Boolean) || [];
      setStudentClasses(classes as StudentClass[]);
    } catch (error) {
      console.error('Error fetching student classes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos classes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Get student ID first
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!studentData) return;

      // Build query based on class filter
      let classIds = studentClasses.map(c => c.id);
      if (selectedClassId) {
        classIds = [selectedClassId];
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

      if (error) throw error;

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
            .single();

          return {
            ...project,
            latest_submission: submission
          };
        })
      );

      setProjects(projectsWithSubmissions);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
    } else if (studentClasses.length === 1) {
      navigate(`/etudiant/soumettre?project_id=${projectId}&class_id=${studentClasses[0].id}`);
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

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

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
          {studentClasses.length > 1 && (
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
                {studentClasses.map((studentClass) => (
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
                  Projets pour : {studentClasses.find(c => c.id === selectedClassId)?.title}
                </p>
              </div>
            )}

            {projects.length === 0 ? (
              <Card className="card-educational">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Aucun projet disponible
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedClassId 
                      ? "Aucun projet n'est assigné à cette classe pour le moment."
                      : "Vous n'avez pas encore de projets assignés."
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