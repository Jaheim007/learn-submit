import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Users, FileText, Clock, AlertCircle, FolderOpen, ArrowRight, TrendingUp, GraduationCap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  'Reçu': { label: 'Reçu', variant: 'default', color: 'hsl(var(--primary))' },
  'En révision': { label: 'En révision', variant: 'secondary', color: 'hsl(var(--warning, 45 93% 47%))' },
  'Validé': { label: 'Validé', variant: 'default', color: 'hsl(var(--success, 142 76% 36%))' },
  'Refusé': { label: 'Refusé', variant: 'destructive', color: 'hsl(var(--destructive))' },
};

const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(45, 93%, 47%)',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
];

interface DashboardData {
  stats: {
    activeStudents: number;
    pendingStudents: number;
    submissionsToday: number;
    pendingReviews: number;
    upcomingDeadlines: number;
    activeClasses: number;
  };
  statusDistribution: Record<string, number>;
  topClasses: Array<{ code: string; title: string; students: number; submissions: number }>;
  recentSubmissions: Array<{
    id: string; submitted_at: string; status: string;
    student_name: string; project_title: string; class_code: string;
  }>;
  recentProjects: Array<{
    id: number; title: string; deadline_at: string; class_codes: string[];
  }>;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: result, error } = await supabase.functions.invoke('admin-dashboard-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setData(result);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><div className="animate-pulse space-y-3"><div className="h-4 bg-muted rounded w-2/3" /><div className="h-8 bg-muted rounded w-1/3" /></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const { stats, statusDistribution, topClasses, recentSubmissions, recentProjects } = data;

  const totalSubmissions = Object.values(statusDistribution).reduce((a, b) => a + b, 0);
  const donutData = Object.entries(statusDistribution).map(([name, value]) => ({ name, value }));
  const barData = topClasses.map(c => ({ name: c.code, étudiants: c.students, soumissions: c.submissions }));

  const statCards = [
    { title: 'Étudiants actifs', value: stats.activeStudents, icon: Users, color: 'text-primary', bg: 'bg-primary/10', onClick: () => navigate('/admin/students') },
    { title: "En attente d'approbation", value: stats.pendingStudents, icon: Clock, color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning))]/10', onClick: () => navigate('/admin/pending-students'), highlight: stats.pendingStudents > 0 },
    { title: "Soumissions aujourd'hui", value: stats.submissionsToday, icon: TrendingUp, color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/10' },
    { title: 'En attente de révision', value: stats.pendingReviews, icon: FileText, color: 'text-secondary', bg: 'bg-secondary/10', onClick: () => navigate('/admin/submissions') },
    { title: 'Échéances (7 jours)', value: stats.upcomingDeadlines, icon: AlertCircle, color: 'text-[hsl(var(--destructive))]', bg: 'bg-[hsl(var(--destructive))]/10' },
    { title: 'Classes actives', value: stats.activeClasses, icon: GraduationCap, color: 'text-primary', bg: 'bg-primary/10', onClick: () => navigate('/admin/classes') },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme Hacktualiz</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className={cn(
              'transition-all duration-200 hover:shadow-md border-border/60',
              stat.onClick && 'cursor-pointer hover:-translate-y-0.5',
              stat.highlight && 'ring-2 ring-[hsl(var(--warning))]/30'
            )}
            onClick={stat.onClick}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2 rounded-xl', stat.bg)}>
                  <stat.icon className={cn('h-4 w-4', stat.color)} />
                </div>
                {stat.highlight && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--warning))] animate-pulse" />
                )}
              </div>
              <p className="text-2xl font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-2 leading-tight">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Donut Chart - Submissions by Status */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-2 px-6 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground">Répartition des soumissions</CardTitle>
            <p className="text-xs text-muted-foreground">{totalSubmissions} soumissions au total</p>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-[140px] h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((_, index) => (
                        <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {donutData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{entry.value}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {totalSubmissions > 0 ? Math.round((entry.value / totalSubmissions) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Classes */}
        <Card className="border-border/60 lg:col-span-3">
          <CardHeader className="pb-2 px-6 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground">Classes les plus actives</CardTitle>
            <p className="text-xs text-muted-foreground">Étudiants et soumissions par classe</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Bar dataKey="étudiants" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="soumissions" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              Projets récents
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate('/admin/projects')}>
              Voir tout <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-2">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun projet récent</p>
            ) : (
              recentProjects.map((project) => (
                <div key={project.id} className="flex items-start justify-between p-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {project.class_codes.slice(0, 5).map((code) => (
                        <span key={code} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{code}</span>
                      ))}
                      {project.class_codes.length > 5 && <span className="text-[10px] text-muted-foreground">+{project.class_codes.length - 5}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-3">
                    {project.deadline_at ? formatDistanceToNow(new Date(project.deadline_at), { addSuffix: true, locale: fr }) : 'Pas de deadline'}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Soumissions récentes
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate('/admin/submissions')}>
              Voir tout <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-2">
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune soumission récente</p>
            ) : (
              recentSubmissions.map((sub) => {
                const cfg = statusConfig[sub.status] || { label: sub.status, variant: 'outline' as const, color: 'hsl(var(--muted-foreground))' };
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{sub.student_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {sub.project_title} · {sub.class_code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 ml-3 shrink-0">
                      <Badge variant={cfg.variant} className="text-[10px] h-5">{cfg.label}</Badge>
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
