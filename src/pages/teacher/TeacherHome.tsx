import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, BookOpen, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Stats {
  myClasses: number;
  myStudents: number;
  pendingSubmissions: number;
  totalSubmissions: number;
}

export default function TeacherHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    myClasses: 0,
    myStudents: 0,
    pendingSubmissions: 0,
    totalSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Get teacher's assigned classes
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id')
        .eq('supervisor_user_id', user?.id);

      const classIds = assignments?.map(a => a.class_id) || [];

      // Get students count in teacher's classes
      const { count: studentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds);

      // Get submissions in teacher's classes
      const { data: submissions } = await supabase
        .from('submissions')
        .select('status')
        .in('class_id', classIds);

      const pendingCount = submissions?.filter(s => s.status === 'Reçu' || s.status === 'En révision').length || 0;

      setStats({
        myClasses: classIds.length,
        myStudents: studentsCount || 0,
        pendingSubmissions: pendingCount,
        totalSubmissions: submissions?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Mes Classes',
      value: stats.myClasses,
      icon: BookOpen,
      description: 'Classes assignées',
    },
    {
      title: 'Mes Étudiants',
      value: stats.myStudents,
      icon: Users,
      description: 'Étudiants actifs',
    },
    {
      title: 'À réviser',
      value: stats.pendingSubmissions,
      icon: FileText,
      description: 'Soumissions en attente',
    },
    {
      title: 'Total soumissions',
      value: stats.totalSubmissions,
      icon: MessageSquare,
      description: 'Toutes les soumissions',
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
        <h1 className="text-3xl font-bold text-foreground">Dashboard Formateur</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenue dans votre espace formateur
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
              • Réviser les soumissions en attente
            </p>
            <p className="text-sm text-muted-foreground">
              • Suivre les progrès des étudiants
            </p>
            <p className="text-sm text-muted-foreground">
              • Gérer le contenu des cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messagerie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Communiquez avec vos étudiants via le système de messagerie intégré
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
