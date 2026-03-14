import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, BookOpen, ChevronRight, Clock, FolderOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ClassInfo {
  id: number;
  code: string;
  title: string;
  studentCount: number;
  submissionCount: number;
  pendingCount: number;
}

interface Stats {
  myClasses: ClassInfo[];
  myStudents: number;
  pendingSubmissions: number;
  totalSubmissions: number;
}

export default function TeacherHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    myClasses: [],
    myStudents: 0,
    pendingSubmissions: 0,
    totalSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id, classes(id, code, title)')
        .eq('supervisor_user_id', user?.id);

      const classIds = assignments?.map(a => a.class_id) || [];

      if (classIds.length === 0) {
        setStats({ myClasses: [], myStudents: 0, pendingSubmissions: 0, totalSubmissions: 0 });
        setLoading(false);
        return;
      }

      const [{ data: enrollments }, { data: submissions }] = await Promise.all([
        supabase.from('enrollments').select('class_id, student_id').in('class_id', classIds),
        supabase.from('submissions').select('class_id, status').in('class_id', classIds),
      ]);

      const myClasses: ClassInfo[] = (assignments || []).map(a => {
        const cls = a.classes as any;
        const classEnrollments = enrollments?.filter(e => e.class_id === a.class_id) || [];
        const classSubs = submissions?.filter(s => s.class_id === a.class_id) || [];
        const pending = classSubs.filter(s => s.status === 'Reçu' || s.status === 'En révision').length;
        return {
          id: cls.id,
          code: cls.code,
          title: cls.title,
          studentCount: classEnrollments.length,
          submissionCount: classSubs.length,
          pendingCount: pending,
        };
      });

      const pendingCount = submissions?.filter(s => s.status === 'Reçu' || s.status === 'En révision').length || 0;

      setStats({
        myClasses,
        myStudents: enrollments?.length || 0,
        pendingSubmissions: pendingCount,
        totalSubmissions: submissions?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Formateur</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de vos classes et soumissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myClasses.length}</div>
            <p className="text-xs text-muted-foreground">Classes assignées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myStudents}</div>
            <p className="text-xs text-muted-foreground">Dans vos classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À réviser</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">En attente de révision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soumissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Total reçues</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Classes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Mes Classes Assignées</h2>
        {stats.myClasses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Aucune classe assignée pour le moment</p>
              <p className="text-sm text-muted-foreground mt-1">Contactez l'administration pour être assigné à des classes.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {stats.myClasses.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cls.code}</CardTitle>
                      <CardDescription>{cls.title}</CardDescription>
                    </div>
                    {cls.pendingCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {cls.pendingCount} en attente
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {cls.studentCount} étudiants
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> {cls.submissionCount} soumissions
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/teacher/submissions')}
                      className="text-xs"
                    >
                      Voir <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/teacher/submissions')}>
          <CardContent className="pt-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="font-medium text-sm">Réviser les soumissions</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.pendingSubmissions} en attente</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/teacher/students')}>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="font-medium text-sm">Voir les étudiants</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.myStudents} étudiants actifs</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/teacher/projects')}>
          <CardContent className="pt-6 text-center">
            <FolderOpen className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="font-medium text-sm">Gérer les projets</p>
            <p className="text-xs text-muted-foreground mt-1">Créer & assigner</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/teacher/courses')}>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="font-medium text-sm">Gérer les cours</p>
            <p className="text-xs text-muted-foreground mt-1">Contenu pédagogique</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
