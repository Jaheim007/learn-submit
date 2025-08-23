import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Clock, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Stats {
  totalSubmissions: number;
  submissionsToday: number;
  pendingReviews: number;
  upcomingDeadlines: number;
  totalStudents: number;
  totalSupervisors: number;
}

export default function AdminOverview() {
  const { isAdmin, loading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalSubmissions: 0,
    submissionsToday: 0,
    pendingReviews: 0,
    upcomingDeadlines: 0,
    totalStudents: 0,
    totalSupervisors: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && isAdmin) {
      loadStats();
    }
  }, [loading, isAdmin]);

  const loadStats = async () => {
    try {
      // Get submissions stats
      const { data: submissions } = await supabase
        .from('submissions')
        .select('status, submitted_at');

      const today = new Date().toISOString().split('T')[0];
      const submissionsToday = submissions?.filter(s => 
        s.submitted_at.startsWith(today)
      ).length || 0;

      const pendingReviews = submissions?.filter(s => 
        s.status === 'Reçu' || s.status === 'En révision'
      ).length || 0;

      // Get projects with upcoming deadlines (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { data: projects } = await supabase
        .from('projects')
        .select('deadline_at')
        .not('deadline_at', 'is', null)
        .lte('deadline_at', nextWeek.toISOString());

      // Get user counts
      const { data: students } = await supabase
        .from('students')
        .select('id');

      const { data: supervisors } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'supervisor');

      setStats({
        totalSubmissions: submissions?.length || 0,
        submissionsToday,
        pendingReviews,
        upcomingDeadlines: projects?.length || 0,
        totalStudents: students?.length || 0,
        totalSupervisors: supervisors?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord Admin</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble des soumissions et utilisateurs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soumissions totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.submissionsToday} aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente de révision</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échéances proches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">
              Dans les 7 prochains jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Utilisateurs inscrits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Superviseurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalSupervisors}</div>
            <p className="text-xs text-muted-foreground">
              Accès aux classes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}