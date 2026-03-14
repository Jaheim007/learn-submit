import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { Calendar, Send, AlertCircle, Clock, CheckCircle2, FolderOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';

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
  image_url?: string | null;
  latest_submission?: {
    id: number;
    status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
    submitted_at: string;
  } | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

export default function StudentProjects() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

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
    if (classes.length > 0 && selectedClassId && studentId) {
      fetchProjects();
    }
  }, [selectedClassId, classes, studentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!studentData) {
        setLoading(false);
        return;
      }

      setStudentId(studentData.id);

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
    if (!selectedClassId || !studentId) return;

    setLoadingProjects(true);
    try {
      const { data } = await supabase
        .from('class_projects')
        .select(`
          project_id,
          projects (
            id, code, title, description, due_at, deadline_at, image_url
          )
        `)
        .eq('class_id', selectedClassId);

      const projectsList = data?.map((cp: any) => cp.projects).filter(Boolean) || [];
      
      // Batch fetch all submissions for this student in this class (fixes N+1 query)
      const projectIds = projectsList.map((p: any) => p.id);
      const { data: allSubmissions } = projectIds.length > 0
        ? await supabase
            .from('submissions')
            .select('id, status, submitted_at, project_id')
            .eq('student_id', studentId)
            .in('project_id', projectIds)
            .order('submitted_at', { ascending: false })
        : { data: [] };

      // Group by project_id, keep only latest per project
      const latestByProject: Record<number, any> = {};
      (allSubmissions || []).forEach((sub: any) => {
        if (!latestByProject[sub.project_id]) {
          latestByProject[sub.project_id] = sub;
        }
      });

      const projectsWithSubmissions = projectsList.map((project: any) => ({
        ...project,
        latest_submission: latestByProject[project.id] || null,
      }));

      setProjects(projectsWithSubmissions);
    } catch (error) {
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoadingProjects(false);
    }
  };

  const getDeadlineInfo = (project: Project) => {
    const deadline = project.deadline_at || project.due_at;
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (diff <= 0) return { label: 'Expiré', urgent: true, days: 0 };
    if (days <= 2) return { label: `${days}j restant${days > 1 ? 's' : ''}`, urgent: true, days };
    if (days <= 7) return { label: `${days} jours`, urgent: false, days };
    return { label: new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), urgent: false, days };
  };

  if (loading || authLoading || loadingProjects) return <LoadingScreen />;

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <StudentDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Mes Projets</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {projects.length} projet{projects.length !== 1 ? 's' : ''} {selectedClass ? `· ${selectedClass.title}` : ''}
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {projects.filter(p => p.latest_submission?.status === 'Validé').length} validé{projects.filter(p => p.latest_submission?.status === 'Validé').length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs font-semibold">
                <Clock className="h-3.5 w-3.5" />
                {projects.filter(p => p.latest_submission && ['Reçu', 'En révision'].includes(p.latest_submission.status)).length} en révision
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                {projects.filter(p => !p.latest_submission).length} non soumis
              </div>
            </div>
          </div>
        </motion.div>

        {/* Class Tabs */}
        {classes.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 flex-wrap"
          >
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`
                  px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                  ${selectedClassId === cls.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border/60 hover:border-border hover:shadow-sm'
                  }
                `}
              >
                {cls.code}
              </button>
            ))}
          </motion.div>
        )}

        {/* Project Grid */}
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="h-20 w-20 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
              <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">Aucun projet</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center">
              Les projets assignés à votre classe apparaîtront ici
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 lg:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {projects.map((project: any) => {
              const isExpired = project.deadline_at && new Date(project.deadline_at) < new Date();
              const deadlineInfo = getDeadlineInfo(project);

              return (
                <motion.div
                  key={project.id}
                  variants={item}
                  className="group relative bg-card rounded-2xl border border-border/60 overflow-hidden hover:border-border hover:shadow-lg transition-all duration-300"
                >
                  {/* Image or gradient header */}
                  {project.image_url ? (
                    <div className="relative h-36 lg:h-40 w-full overflow-hidden">
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-sm text-[11px] font-bold text-foreground border border-border/30">
                          {project.code}
                        </span>
                      </div>
                      {deadlineInfo && (
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm ${
                            deadlineInfo.urgent
                              ? 'bg-destructive/90 text-destructive-foreground'
                              : 'bg-background/90 text-muted-foreground border border-border/30'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {deadlineInfo.label}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-24 lg:h-28 w-full overflow-hidden bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/3">
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-[11px] font-bold text-foreground border border-border/30">
                          {project.code}
                        </span>
                        {deadlineInfo && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm ${
                            deadlineInfo.urgent
                              ? 'bg-destructive/90 text-destructive-foreground'
                              : 'bg-background/80 text-muted-foreground border border-border/30'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {deadlineInfo.label}
                          </span>
                        )}
                      </div>
                      {/* Decorative circles */}
                      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/5" />
                      <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-secondary/5" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 lg:p-5 space-y-3">
                    <div>
                      <h3 className="text-sm lg:text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      {project.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed [&_*]:!m-0 [&_*]:!p-0 [&_*]:!inline">
                          <RichTextRenderer content={project.description} className="[&_p]:!mb-0 [&_h2]:!text-xs [&_h2]:!inline" />
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    {project.latest_submission && (
                      <StatusBadge status={project.latest_submission.status} />
                    )}

                    {/* Action */}
                    <Button
                      onClick={() => navigate(`/etudiant/soumettre/${project.id}`)}
                      className="w-full text-xs font-semibold h-9 rounded-xl group/btn"
                      size="sm"
                      disabled={isExpired}
                      variant={isExpired ? "outline" : "default"}
                    >
                      {isExpired ? (
                        'Délai expiré'
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-2" />
                          Soumettre
                          <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </StudentDashboardLayout>
  );
}
