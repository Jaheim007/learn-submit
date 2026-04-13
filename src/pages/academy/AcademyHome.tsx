import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, GraduationCap, BookOpen, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface Stats {
  totalStudents: number;
  activeStudents: number;
  pendingStudents: number;
  totalSubmissions: number;
  totalClasses: number;
  totalProjects: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  receivedSubmissions: number;
  reviewingSubmissions: number;
}

interface ClassSubmissionData {
  name: string;
  soumissions: number;
  validées: number;
  refusées: number;
}

interface CompletionData {
  name: string;
  taux: number;
}

interface ActivityData {
  date: string;
  soumissions: number;
  inscriptions: number;
}

const CHART_COLORS = ['hsl(248, 53%, 58%)', 'hsl(152, 60%, 36%)', 'hsl(0, 72%, 51%)', 'hsl(38, 92%, 50%)'];
const PIE_COLORS = ['hsl(152, 60%, 36%)', 'hsl(0, 72%, 51%)', 'hsl(248, 53%, 58%)', 'hsl(38, 92%, 50%)'];

export default function AcademyHome() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, activeStudents: 0, pendingStudents: 0,
    totalSubmissions: 0, totalClasses: 0, totalProjects: 0,
    approvedSubmissions: 0, rejectedSubmissions: 0, receivedSubmissions: 0, reviewingSubmissions: 0,
  });
  const [classData, setClassData] = useState<ClassSubmissionData[]>([]);
  const [completionData, setCompletionData] = useState<CompletionData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      await Promise.all([loadStats(), loadClassSubmissions(), loadCompletionRates(), loadActivityTimeline(), loadRecentActivity()]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const [studentsRes, submissionsRes, classesRes, projectsRes] = await Promise.all([
      supabase.from('students').select('status'),
      supabase.from('submissions').select('status'),
      supabase.from('classes').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
    ]);
    const students = studentsRes.data || [];
    const subs = submissionsRes.data || [];
    setStats({
      totalStudents: students.length,
      activeStudents: students.filter(s => s.status === 'active').length,
      pendingStudents: students.filter(s => s.status === 'pending').length,
      totalSubmissions: subs.length,
      totalClasses: classesRes.count || 0,
      totalProjects: projectsRes.count || 0,
      approvedSubmissions: subs.filter(s => s.status === 'approved').length,
      rejectedSubmissions: subs.filter(s => s.status === 'rejected').length,
      receivedSubmissions: subs.filter(s => s.status === 'received').length,
      reviewingSubmissions: subs.filter(s => s.status === 'reviewing').length,
    });
  };

  const loadClassSubmissions = async () => {
    const { data: subs } = await supabase.from('submissions').select('class_id, status, classes!inner(title)');
    if (!subs) return;
    const map: Record<string, { total: number; approved: number; rejected: number }> = {};
    subs.forEach((s: any) => {
      const name = s.classes?.title || 'Inconnue';
      if (!map[name]) map[name] = { total: 0, approved: 0, rejected: 0 };
      map[name].total++;
      if (s.status === 'approved') map[name].approved++;
      if (s.status === 'rejected') map[name].rejected++;
    });
    setClassData(Object.entries(map).map(([name, v]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '…' : name,
      soumissions: v.total, validées: v.approved, refusées: v.rejected,
    })));
  };

  const loadCompletionRates = async () => {
    const [{ data: projects }, { data: classProjects }, { data: subs }, { data: enrollments }] = await Promise.all([
      supabase.from('projects').select('id, title').eq('is_active', true),
      supabase.from('class_projects').select('project_id, class_id'),
      supabase.from('submissions').select('project_id, student_id, status').eq('is_latest', true),
      supabase.from('enrollments').select('student_id, class_id'),
    ]);
    if (!projects || !classProjects || !subs || !enrollments) return;

    const result: CompletionData[] = projects.slice(0, 8).map(p => {
      const cpClasses = classProjects.filter(cp => cp.project_id === p.id).map(cp => cp.class_id);
      const eligibleStudents = new Set(enrollments.filter(e => cpClasses.includes(e.class_id)).map(e => e.student_id));
      const submitted = new Set(subs.filter(s => s.project_id === p.id).map(s => s.student_id));
      const rate = eligibleStudents.size > 0 ? Math.round((submitted.size / eligibleStudents.size) * 100) : 0;
      return { name: p.title.length > 15 ? p.title.substring(0, 15) + '…' : p.title, taux: rate };
    });
    setCompletionData(result);
  };

  const loadActivityTimeline = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [{ data: subs }, { data: students }] = await Promise.all([
      supabase.from('submissions').select('submitted_at').gte('submitted_at', thirtyDaysAgo.toISOString()),
      supabase.from('students').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
    ]);
    const dayMap: Record<string, { soumissions: number; inscriptions: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { soumissions: 0, inscriptions: 0 };
    }
    subs?.forEach(s => { const k = s.submitted_at.split('T')[0]; if (dayMap[k]) dayMap[k].soumissions++; });
    students?.forEach(s => { const k = s.created_at.split('T')[0]; if (dayMap[k]) dayMap[k].inscriptions++; });
    setActivityData(Object.entries(dayMap).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      ...v,
    })));
  };

  const loadRecentActivity = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setRecentLogs(data || []);
  };

  const ACTION_LABELS: Record<string, string> = {
    submission_created: '📝 Nouvelle soumission',
    submission_status_changed: '✅ Statut modifié',
    student_registered: '👤 Nouvel étudiant',
    student_status_changed: '🔄 Statut étudiant',
    project_created: '📁 Nouveau projet',
  };

  const pieData = [
    { name: 'Validées', value: stats.approvedSubmissions },
    { name: 'Refusées', value: stats.rejectedSubmissions },
    { name: 'En révision', value: stats.reviewingSubmissions },
    { name: 'Reçues', value: stats.receivedSubmissions },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Académique</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de la plateforme NYS Africa</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Étudiants actifs', value: stats.activeStudents, icon: Users, desc: `${stats.totalStudents} au total`, color: 'text-primary' },
          { title: 'En attente', value: stats.pendingStudents, icon: Clock, desc: 'Approbations requises', color: 'text-warning' },
          { title: 'Soumissions', value: stats.totalSubmissions, icon: FileText, desc: `${stats.approvedSubmissions} validées`, color: 'text-success' },
          { title: 'Classes actives', value: stats.totalClasses, icon: BookOpen, desc: `${stats.totalProjects} projets`, color: 'text-primary' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Soumissions par classe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                  <Bar dataKey="soumissions" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="validées" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="refusées" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Répartition des statuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Aucune soumission</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Taux de complétion par projet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={completionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                  <Bar dataKey="taux" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Aucun projet actif</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Activité des 30 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="soumissions" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="inscriptions" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {ACTION_LABELS[log.action] || log.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.user_name || 'Système'} 
                      {log.details?.project && ` — ${log.details.project}`}
                      {log.details?.class && ` (${log.details.class})`}
                      {log.details?.new_status && ` → ${log.details.new_status}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune activité enregistrée pour le moment</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
