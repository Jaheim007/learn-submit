import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, BookOpen } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';

interface SupervisorStats {
  assignedClasses: Array<{
    id: number;
    code: string;
    title: string;
    studentCount: number;
    submissionCount: number;
  }>;
  totalStudents: number;
  totalSubmissions: number;
  pendingReviews: number;
}

export default function SupervisorDashboard() {
  const { loading } = useAuth();
  const { isSupervisor } = useRoles();
  const [stats, setStats] = useState<SupervisorStats>({
    assignedClasses: [],
    totalStudents: 0,
    totalSubmissions: 0,
    pendingReviews: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && isSupervisor) {
      loadStats();
    }
  }, [loading, isSupervisor]);

  const loadStats = async () => {
    try {
      // Get assigned classes
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select(`
          class_id,
          classes (id, code, title)
        `);

      if (!assignments) return;

      const classIds = assignments.map(a => a.class_id);

      // Get students count per class
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id, student_id')
        .in('class_id', classIds);

      // Get submissions count per class
      const { data: submissions } = await supabase
        .from('submissions')
        .select('class_id, status')
        .in('class_id', classIds);

      const assignedClasses = assignments.map(assignment => {
        const classEnrollments = enrollments?.filter(e => e.class_id === assignment.class_id) || [];
        const classSubmissions = submissions?.filter(s => s.class_id === assignment.class_id) || [];
        
        return {
          id: assignment.class_id,
          code: (assignment.classes as any).code,
          title: (assignment.classes as any).title,
          studentCount: classEnrollments.length,
          submissionCount: classSubmissions.length
        };
      });

      const pendingReviews = submissions?.filter(s => 
        s.status === 'Reçu' || s.status === 'En révision'
      ).length || 0;

      setStats({
        assignedClasses,
        totalStudents: enrollments?.length || 0,
        totalSubmissions: submissions?.length || 0,
        pendingReviews
      });
    } catch (error) {
      console.error('Error loading supervisor stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (!isSupervisor) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord Superviseur</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de vos classes assignées
        </p>
        <Badge variant="secondary" className="mt-2">
          Accès limité aux classes assignées
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes assignées</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.assignedClasses.length}</div>
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
              Dans vos classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soumissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReviews} en attente
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Mes Classes</h2>
        <div className="grid gap-4">
          {loadingStats ? (
            <div className="text-center py-8">Chargement des classes...</div>
          ) : stats.assignedClasses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Aucune classe assignée</p>
              </CardContent>
            </Card>
          ) : (
            stats.assignedClasses.map((classItem) => (
              <Card key={classItem.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{classItem.code}</CardTitle>
                      <CardDescription>{classItem.title}</CardDescription>
                    </div>
                    <Link to="/superviseur/soumissions">
                      <Badge variant="outline">
                        Voir les soumissions
                      </Badge>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{classItem.studentCount} étudiants</span>
                    <span>{classItem.submissionCount} soumissions</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}