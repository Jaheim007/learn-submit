import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, Clock, AlertCircle, FolderOpen, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Stats {
  totalStudents: number;
  pendingStudents: number;
  submissionsToday: number;
  pendingReviews: number;
  upcomingDeadlines: number;
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

export default function AdminHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    pendingStudents: 0,
    submissionsToday: 0,
    pendingReviews: 0,
    upcomingDeadlines: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load stats
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        studentsCount,
        pendingCount,
        submissionsToday,
        pendingReviews,
        upcomingDeadlines,
        recentSubmissions,
        recentProjects
      ] = await Promise.all([
        // Total active students
        supabase
          .from('students')
          .select('id', { count: 'exact' })
          .eq('is_active', true)
          .eq('status', 'active'),
        
        // Pending students
        supabase
          .from('students')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        
        // Submissions today
        supabase
          .from('submissions')
          .select('id', { count: 'exact' })
          .gte('submitted_at', today + 'T00:00:00'),
        
        // Pending reviews
        supabase
          .from('submissions')
          .select('id', { count: 'exact' })
          .in('status', ['Reçu', 'En révision']),
        
        // Upcoming deadlines
        supabase
          .from('projects')
          .select('id', { count: 'exact' })
          .gte('deadline_at', new Date().toISOString())
          .lte('deadline_at', weekFromNow),
        
        // Recent submissions
        supabase
          .from('submissions')
          .select(`
            id,
            submitted_at,
            status,
            students!inner(full_name),
            projects!inner(title),
            classes!inner(code)
          `)
          .order('submitted_at', { ascending: false })
          .limit(10),
        
        // Recent projects
        supabase
          .from('projects')
          .select(`
            id,
            title,
            deadline_at,
            class_projects!inner(
              classes!inner(code)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      setStats({
        totalStudents: studentsCount.count || 0,
        pendingStudents: pendingCount.count || 0,
        submissionsToday: submissionsToday.count || 0,
        pendingReviews: pendingReviews.count || 0,
        upcomingDeadlines: upcomingDeadlines.count || 0,
      });

      // Format recent submissions
      if (recentSubmissions.data) {
        setRecentSubmissions(
          recentSubmissions.data.map((sub: any) => ({
            id: sub.id,
            submitted_at: sub.submitted_at,
            status: sub.status,
            student_name: sub.students.full_name,
            project_title: sub.projects.title,
            class_code: sub.classes.code,
          }))
        );
      }

      // Format recent projects
      if (recentProjects.data) {
        setRecentProjects(
          recentProjects.data.map((proj: any) => ({
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme NYS</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/students')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Étudiants actifs</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-yellow-200 bg-yellow-50/50" 
          onClick={() => navigate('/admin/pending-students')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente d'approbation</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Soumissions aujourd'hui</p>
                <p className="text-2xl font-bold text-foreground">{stats.submissionsToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente de révision</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Échéances (7 jours)</p>
                <p className="text-2xl font-bold text-foreground">{stats.upcomingDeadlines}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5" />
              <span>Projets récents</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/projects')}>
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-foreground">{project.title}</h4>
                  <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <span>Classes: {project.class_codes.join(', ')}</span>
                    <span>
                      Échéance: {formatDistanceToNow(new Date(project.deadline_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {recentProjects.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Aucun projet récent</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Soumissions récentes</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/submissions')}>
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{submission.student_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {submission.project_title} • {submission.class_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(submission.status)}`}>
                        {submission.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(submission.submitted_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {recentSubmissions.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Aucune soumission récente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}