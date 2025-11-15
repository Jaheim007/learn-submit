import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, GraduationCap, BookOpen } from 'lucide-react';

interface Stats {
  totalStudents: number;
  activeStudents: number;
  pendingStudents: number;
  totalSubmissions: number;
  totalClasses: number;
  totalProjects: number;
}

export default function AcademyHome() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    pendingStudents: 0,
    totalSubmissions: 0,
    totalClasses: 0,
    totalProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [studentsRes, submissionsRes, classesRes, projectsRes] = await Promise.all([
        supabase.from('students').select('status', { count: 'exact' }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
      ]);

      const totalStudents = studentsRes.count || 0;
      const activeStudents = studentsRes.data?.filter(s => s.status === 'active').length || 0;
      const pendingStudents = studentsRes.data?.filter(s => s.status === 'pending').length || 0;

      setStats({
        totalStudents,
        activeStudents,
        pendingStudents,
        totalSubmissions: submissionsRes.count || 0,
        totalClasses: classesRes.count || 0,
        totalProjects: projectsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Étudiants actifs',
      value: stats.activeStudents,
      icon: Users,
      description: `${stats.totalStudents} au total`,
    },
    {
      title: 'En attente',
      value: stats.pendingStudents,
      icon: GraduationCap,
      description: 'Approbations requises',
    },
    {
      title: 'Soumissions',
      value: stats.totalSubmissions,
      icon: FileText,
      description: 'Total des projets soumis',
    },
    {
      title: 'Classes actives',
      value: stats.totalClasses,
      icon: BookOpen,
      description: `${stats.totalProjects} projets`,
    },
  ];

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
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de la plateforme NYS Africa
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Approuver les nouveaux étudiants
            </p>
            <p className="text-sm text-muted-foreground">
              • Gérer les classes et projets
            </p>
            <p className="text-sm text-muted-foreground">
              • Superviser les soumissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fonctionnalité à venir - suivi en temps réel de l'activité de la plateforme
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
