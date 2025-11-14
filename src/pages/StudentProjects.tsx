import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { Calendar, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { DeadlineCountdown } from '@/components/DeadlineCountdown';

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
  deadline_at: string | null;
  latest_submission?: {
    id: number;
    status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
    submitted_at: string;
  } | null;
}

export default function StudentProjects() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    const classParam = searchParams.get('class');
    if (classParam) setSelectedClassId(parseInt(classParam));
  }, [searchParams]);

  useEffect(() => {
    if (classes.length > 0) fetchProjects();
  }, [selectedClassId, classes]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!studentData) return;

      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('class_id, classes(id, code, title)')
        .eq('student_id', studentData.id);

      const classList = enrollmentsData?.map((e: any) => e.classes).filter(Boolean) || [];
      setClasses(classList);
      
      if (!selectedClassId && classList.length > 0) {
        setSelectedClassId(classList[0].id);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!selectedClassId) return;

    try {
      const { data } = await supabase
        .from('class_projects')
        .select(`
          project_id,
          projects (
            id,
            code,
            title,
            description,
            due_at,
            deadline_at,
            image_url
          )
        `)
        .eq('class_id', selectedClassId);

      const projectsList = data?.map((cp: any) => cp.projects).filter(Boolean) || [];
      
      const studentData = await supabase.from('students').select('id').eq('user_id', user?.id).single();
      
      const projectsWithSubmissions = await Promise.all(
        projectsList.map(async (project: any) => {
          const { data: submissions } = await supabase
            .from('submissions')
            .select('id, status, submitted_at')
            .eq('project_id', project.id)
            .eq('student_id', studentData.data?.id)
            .order('submitted_at', { ascending: false })
            .limit(1);

          return {
            ...project,
            latest_submission: submissions?.[0] || null
          };
        })
      );

      setProjects(projectsWithSubmissions);
    } catch (error) {
      toast.error('Erreur lors du chargement des projets');
    }
  };

  if (loading || authLoading) return <LoadingScreen />;

  return (
    <StudentDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Mes Projets</h1>
          <p className="text-muted-foreground">Consultez et soumettez vos projets</p>
        </div>

        {classes.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {classes.map((cls) => (
              <Button
                key={cls.id}
                variant={selectedClassId === cls.id ? 'default' : 'outline'}
                onClick={() => setSelectedClassId(cls.id)}
              >
                {cls.code}
              </Button>
            ))}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Aucun projet</h3>
              <p className="text-muted-foreground">Contactez votre administrateur</p>
            </div>
          ) : (
            projects.map((project: any) => (
              <div key={project.id} className="premium-card overflow-hidden hover:scale-[1.02] transition-transform">
                {project.image_url && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img 
                      src={project.image_url} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur">{project.code}</Badge>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  {!project.image_url && (
                    <Badge variant="outline" className="mb-2">{project.code}</Badge>
                  )}
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>

                  {project.deadline_at && (
                    <div className="mb-4">
                      <DeadlineCountdown deadline={project.deadline_at} />
                    </div>
                  )}

                  {project.due_at && !project.deadline_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(project.due_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}

                  {project.latest_submission && (
                    <div className="mb-4">
                      <StatusBadge status={project.latest_submission.status} />
                    </div>
                  )}

                  <Button onClick={() => navigate(`/etudiant/soumettre/${project.id}`)} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Soumettre
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </StudentDashboardLayout>
  );
}
