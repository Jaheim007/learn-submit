import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, BarChart3, Users, FileText, FolderOpen, UserCheck, Settings, BookOpen, GraduationCap, School, ArrowLeft, Mail } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import kelyaLogo from '@/assets/kelya-logo-dark.png';
import hacktualizeLogoDark from '@/assets/hacktualiz-logo-dark.png';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { path: '/admin', label: 'Tableau de bord', icon: BarChart3 },
    { path: '/admin/students', label: 'Étudiants', icon: Users },
    { path: '/admin/classes', label: 'Classes', icon: School },
    { path: '/admin/submissions', label: 'Soumissions', icon: FileText },
    { path: '/admin/projects', label: 'Projets', icon: FolderOpen },
    { path: '/admin/courses', label: 'Cours', icon: BookOpen },
    { path: '/admin/users', label: 'Utilisateurs', icon: Users },
    { path: '/admin/emails', label: 'Emails', icon: Mail },
    { path: '/admin/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen w-full relative">
      <AnimatedBackground />
      
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 z-20 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <img src={kelyaLogo} alt="Kelya Group" className="h-8 w-8 rounded-md object-cover" />
            <span className="text-muted-foreground text-xs">×</span>
            <img src={hacktualizeLogoDark} alt="Hacktualiz" className="h-8 w-8 rounded-md object-cover" />
            <div className="ml-1">
              <h2 className="font-heading font-bold text-sm text-foreground leading-tight">Kelya × Hacktualiz</h2>
              <p className="text-[10px] text-muted-foreground">Administration</p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="px-4 pt-3 pb-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/etudiant/projets')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au portail
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 relative z-10">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 bg-background/40 backdrop-blur-xl flex items-center justify-between px-6">
          <h1 className="text-xl font-heading font-semibold text-foreground">
            {navItems.find(item => item.path === location.pathname)?.label || 'Administration'}
          </h1>
        </div>
        
        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
