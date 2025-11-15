import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, BarChart3, Users, FileText, FolderOpen, UserCheck, Settings, BookOpen, Clock } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import nysLogo from '@/assets/nys-logo.png';

export default function AcademyLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/academy/login');
  };

  const navItems = [
    { path: '/academy', label: 'Tableau de bord', icon: BarChart3 },
    { path: '/academy/pending-students', label: 'En attente', icon: Clock },
    { path: '/academy/students', label: 'Étudiants', icon: Users },
    { path: '/academy/submissions', label: 'Soumissions', icon: FileText },
    { path: '/academy/projects', label: 'Projets', icon: FolderOpen },
    { path: '/academy/courses', label: 'Cours', icon: BookOpen },
    { path: '/academy/teachers', label: 'Formateurs', icon: UserCheck },
    { path: '/academy/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen w-full relative">
      <AnimatedBackground />
      
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 z-20 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <img src={nysLogo} alt="NYS Africa" className="h-10 w-auto" />
            <div>
              <h2 className="font-bold text-foreground">NYS Academy</h2>
              <p className="text-xs text-muted-foreground">Portail Académique</p>
            </div>
          </div>
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
          <h1 className="text-xl font-semibold text-foreground">
            {navItems.find(item => item.path === location.pathname)?.label || 'Académique'}
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
