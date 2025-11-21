import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Bell, 
  Search,
  TrendingUp,
  BarChart3,
  GraduationCap,
  BookOpen,
  UserCheck,
  LogOut,
  School
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import OrganizationStudents from './OrganizationStudents';
import OrganizationCourses from './OrganizationCourses';
import OrganizationAnalytics from './OrganizationAnalytics';
import OrganizationSettings from './OrganizationSettings';
import OrganizationClasses from './OrganizationClasses';
import OrganizationProjects from './OrganizationProjects';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
}

interface StatsData {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  completionRate: number;
  studentsChange: number;
  coursesChange: number;
}

type ViewType = 'dashboard' | 'students' | 'activities' | 'analytics' | 'settings' | 'classes' | 'projects';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' as ViewType },
  { icon: Users, label: 'People', view: 'students' as ViewType },
  { icon: School, label: 'Classes', view: 'classes' as ViewType },
  { icon: FileText, label: 'Projects', view: 'projects' as ViewType },
  { icon: BookOpen, label: 'Activities', view: 'activities' as ViewType },
  { icon: BarChart3, label: 'Analytics', view: 'analytics' as ViewType },
  { icon: Settings, label: 'Settings', view: 'settings' as ViewType },
];

export default function OrganizationDashboard() {
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userName, setUserName] = useState('Organization');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    completionRate: 0,
    studentsChange: 0,
    coursesChange: 0,
  });
  
  const { activities, loading: activitiesLoading } = useRecentActivity(organization?.id || null);

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Get organization membership
      const { data: membership } = await supabase
        .from('submito_organization_users')
        .select('organization_id, full_name')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        navigate('/onboarding');
        return;
      }

      setUserName(membership.full_name || user.email || 'User');

      // Get organization details
      const { data: org } = await supabase
        .from('submito_organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .single();

      if (org) {
        setOrganization(org);
      }

      // Load real stats
      await loadStats(membership.organization_id);

    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (organizationId: string) => {
    try {
      // Get total students count
      const { count: totalStudents } = await supabase
        .from('submito_organization_students')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Get active students count
      const { count: activeStudents } = await supabase
        .from('submito_organization_students')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      // Get total courses count
      const { count: totalCourses } = await supabase
        .from('submito_organization_courses')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Get submissions for completion rate
      const { data: submissions } = await supabase
        .from('submito_organization_submissions')
        .select('status')
        .eq('organization_id', organizationId);

      const approvedCount = submissions?.filter(s => s.status === 'approved').length || 0;
      const totalSubmissions = submissions?.length || 0;
      const completionRate = totalSubmissions > 0 ? (approvedCount / totalSubmissions) * 100 : 0;

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalCourses: totalCourses || 0,
        completionRate: Math.round(completionRate * 10) / 10,
        studentsChange: 0,
        coursesChange: 0,
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-card/40 backdrop-blur-xl border-r border-border/50">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} className="h-8 w-8 rounded-lg" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
              )}
              <span className="font-bold text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Submito
              </span>
            </div>

            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-1">Welcome,</p>
              <h2 className="text-xl font-bold text-foreground">{userName}</h2>
            </div>

            <nav className="space-y-2 flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-3">MAIN MENU</p>
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentView === item.view
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="mt-auto pt-4 border-t border-border/50">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/organization/signin');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Top Bar */}
          <header className="h-20 border-b border-border/50 bg-card/40 backdrop-blur-xl flex items-center justify-between px-8">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search anything..."
                  className="pl-10 bg-background/50 border-border/50"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
              </Button>

              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={organization?.logo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="p-8 space-y-8">
            {currentView === 'dashboard' && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-card/40 backdrop-blur-xl border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Students
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.totalStudents}</div>
                      <div className="flex items-center gap-1 mt-2">
                        {stats.studentsChange > 0 && <TrendingUp className="h-3 w-3 text-success" />}
                        {stats.studentsChange > 0 && (
                          <span className="text-xs text-success font-medium">+{stats.studentsChange}%</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {stats.studentsChange > 0 ? 'from last month' : 'registered'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/40 backdrop-blur-xl border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Students
                      </CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.activeStudents}</div>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {((stats.activeStudents / stats.totalStudents) * 100).toFixed(1)}% engagement
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/40 backdrop-blur-xl border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Courses
                      </CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.totalCourses}</div>
                      <div className="flex items-center gap-1 mt-2">
                        {stats.coursesChange > 0 && <TrendingUp className="h-3 w-3 text-success" />}
                        {stats.coursesChange > 0 && (
                          <span className="text-xs text-success font-medium">+{stats.coursesChange}%</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {stats.coursesChange > 0 ? 'from last month' : 'available'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/40 backdrop-blur-xl border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Completion Rate
                      </CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.completionRate}%</div>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">
                          Average across all courses
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts and Additional Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 bg-card/40 backdrop-blur-xl border-border/50">
                    <CardHeader>
                      <CardTitle className="text-foreground">Student Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                    <CardHeader>
                      <CardTitle className="text-foreground">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activitiesLoading ? (
                        <div className="text-sm text-muted-foreground">Loading activities...</div>
                      ) : activities.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No recent activity</div>
                      ) : (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                activity.type === 'student' ? 'bg-primary/10' :
                                activity.type === 'submission' ? 'bg-secondary/10' :
                                'bg-accent/10'
                              }`}>
                                {activity.type === 'student' && <Users className="h-4 w-4 text-primary" />}
                                {activity.type === 'submission' && <FileText className="h-4 w-4 text-secondary" />}
                                {activity.type === 'course' && <BookOpen className="h-4 w-4 text-accent" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{activity.message}</p>
                                <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {currentView === 'students' && <OrganizationStudents />}
            {currentView === 'classes' && <OrganizationClasses />}
            {currentView === 'projects' && <OrganizationProjects />}
            {currentView === 'activities' && <OrganizationCourses />}
            {currentView === 'analytics' && <OrganizationAnalytics />}
            {currentView === 'settings' && <OrganizationSettings />}
          </div>
        </main>
      </div>
    </div>
  );
}
