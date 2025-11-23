import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, BookOpen, FileText, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  totalStudents: number;
  activeCourses: number;
  totalSubmissions: number;
  weekSubmissions: number;
  averageGrade: number;
  organizationId: string;
}

export default function OrganizationAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStudents: 0,
    activeCourses: 0,
    totalSubmissions: 0,
    weekSubmissions: 0,
    averageGrade: 0,
    organizationId: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('submito_organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) return;

      const orgId = membership.organization_id;

      // Get total students
      const { count: totalStudents } = await supabase
        .from('submito_organization_students')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      // Get active courses
      const { count: activeCourses } = await supabase
        .from('submito_organization_courses')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true);

      // Get all submissions
      const { data: submissions, count: totalSubmissions } = await supabase
        .from('submito_organization_submissions')
        .select('grade, created_at', { count: 'exact' })
        .eq('organization_id', orgId);

      // Calculate week submissions
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekSubmissions = submissions?.filter(
        (s) => new Date(s.created_at) >= oneWeekAgo
      ).length || 0;

      // Calculate average grade
      const gradesArray = submissions?.filter((s) => s.grade !== null).map((s) => s.grade || 0) || [];
      const averageGrade = gradesArray.length > 0
        ? gradesArray.reduce((a, b) => a + b, 0) / gradesArray.length
        : 0;

      setAnalytics({
        totalStudents: totalStudents || 0,
        activeCourses: activeCourses || 0,
        totalSubmissions: totalSubmissions || 0,
        weekSubmissions,
        averageGrade: Math.round(averageGrade),
        organizationId: orgId,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your organization's performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/40 backdrop-blur-xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{analytics.totalStudents}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">registered students</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{analytics.activeCourses}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">courses running</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{analytics.weekSubmissions}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Grade
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{analytics.averageGrade}%</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">across all courses</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Submissions</p>
              <p className="text-2xl font-bold text-foreground mt-1">{analytics.totalSubmissions}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Weekly Activity</p>
              <p className="text-2xl font-bold text-foreground mt-1">{analytics.weekSubmissions} submissions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
