import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, Clock, AlertCircle, FolderOpen, ArrowRight, TrendingUp, GraduationCap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Stats {
  totalStudents: number;
  pendingStudents: number;
  submissionsToday: number;
  pendingReviews: number;
  upcomingDeadlines: number;
  totalClasses: number;
}

interface RecentSubmission {
  id: string;
  submitted_at: string;
  status: string;
  student_name: string;
  project_title: string;
  class_code: string;
}

interface RecentProject {
  id: number;
  title: string;
  deadline_at: string;
  class_codes: string[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'Reçu': { label: 'Reçu', variant: 'default' },
  'En révision': { label: 'En révision', variant: 'secondary' },
  'Validé': { label: 'Validé', variant: 'default' },
  'Refusé': { label: 'Refusé', variant: 'destructive' },
};

export default function AdminHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    pendingStudents: 0,
    submissionsToday: 0,
    pendingReviews: 0,
    upcomingDeadlines: 0,
    totalClasses: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        studentsCount,
        pendingCount,
        submissionsToday,
        pendingReviews,
        upcomingDeadlines,
        classesCount,
        recentSubs,
        recentProjs
      ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }).eq('is_active', true).eq('status', 'active'),
        supabase.from('students').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('submissions').select('id', { count: 'exact' }).gte('submitted_at', today + 'T00:00:00'),
        supabase.from('submissions').select('id', { count: 'exact' }).in('status', ['Reçu', 'En révision']),
        supabase.from('projects').select('id', { count: 'exact' }).gte('deadline_at', new Date().toISOString()).lte('deadline_at', weekFromNow),
        supabase.from('classes').select('id', { count: 'exact' }).eq('is_active', true),
        supabase
          .from('submissions')
          .select(`id, submitted_at, status, students!inner(full_name), projects!inner(title), classes!inner(code)`)
          .order('submitted_at', { ascending: false })
          .limit(8),
        supabase
          .from('projects')
          .select(`id, title, deadline_at, class_projects!inner(classes!inner(code))`)
          .order('created_at', { ascending: false })
          .limit(4)
      ]);

      setStats({
        totalStudents: studentsCount.count || 0,
        pendingStudents: pendingCount.count || 0,
        submissionsToday: submissionsToday.count || 0,
        pendingReviews: pendingReviews.count || 0,
        upcomingDeadlines: upcomingDeadlines.count || 0,
        totalClasses: classesCount.count || 0,
      });

      if (recentSubs.data) {
        setRecentSubmissions(
          recentSubs.data.map((sub: any) => ({
            id: sub.id,
            submitted_at: sub.submitted_at,
            status: sub.status,
            student_name: sub.students.full_name,
            project_title: sub.projects.title,
            class_code: sub.classes.code,
          }))
        );
      }

      if (recentProjs.data) {
        setRecentProjects(
          recentProjs.data.map((proj: any) => ({
            id: proj.id,
            title: proj.title,
            deadline_at: proj.deadline_at,
            class_codes: proj.class_projects.map((cp: any) => cp.classes.code),
          }))
        );
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-muted rounded w-2/3" /><div className="h-8 bg-muted rounded w-1/3" /></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Étudiants actifs',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      onClick: () => navigate('/admin/students'),
    },
    {
      title: "En attente d'approbation",
      value: stats.pendingStudents,
      icon: Clock,
      color: 'text-[hsl(var(--warning))]',
      bg: 'bg-[hsl(var(--warning))]/10',
      onClick: () => navigate('/admin/pending-students'),
      highlight: stats.pendingStudents > 0,
    },
    {
      title: "Soumissions aujourd'hui",
      value: stats.submissionsToday,
      icon: TrendingUp,
      color: 'text-[hsl(var(--success))]',
      bg: 'bg-[hsl(var(--success))]/10',
    },
    {
      title: 'En attente de révision',
      value: stats.pendingReviews,
      icon: FileText,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      onClick: () => navigate('/admin/submissions'),
    },
    {
      title: 'Échéances (7 jours)',
      value: stats.upcomingDeadlines,
      icon: AlertCircle,
      color: 'text-[hsl(var(--destructive))]',
      bg: 'bg-[hsl(var(--destructive))]/10',
    },
    {
      title: 'Classes actives',
      value: stats.totalClasses,
      icon: GraduationCap,
      color: 'text-primary',
      bg: 'bg-primary/10',
      onClick: () => navigate('/admin/classes'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-[Clash Display]">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme Kelya × Hacktualiz</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className={cn(
              'transition-all hover:shadow-md',
              stat.onClick && 'cursor-pointer hover:-translate-y-0.5',
              stat.highlight && 'ring-2 ring-[hsl(var(--warning))]/30'
            )}
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2 rounded-lg', stat.bg)}>
                  <stat.icon className={cn('h-4 w-4', stat.color)} />
                </div>
                {stat.highlight && (
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--warning))] animate-pulse" />
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              Projets récents
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/admin/projects')}>
              Voir tout <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun projet récent</p>
            ) : (
              recentProjects.map((project) => (
                <div key={project.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {project.class_codes.slice(0, 5).map((code) => (
                        <span key={code} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{code}</span>
                      ))}
                      {project.class_codes.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">+{project.class_codes.length - 5}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                    {formatDistanceToNow(new Date(project.deadline_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Soumissions récentes
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/admin/submissions')}>
              Voir tout <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune soumission récente</p>
            ) : (
              recentSubmissions.map((sub) => {
                const cfg = statusConfig[sub.status] || { label: sub.status, variant: 'outline' as const };
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{sub.student_name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {sub.project_title} · {sub.class_code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant={cfg.variant} className="text-[10px] h-5">
                        {cfg.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...inputs: (string | boolean | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}
