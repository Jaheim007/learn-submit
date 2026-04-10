import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, BarChart3, Users, FileText, BookOpen, MessageSquare, FolderOpen, User, Video } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import hacktualizLogo from '@/assets/hacktualiz-main-logo.jpeg';

export default function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/teacher/login');
  };

  const navItems = [
    { path: '/teacher', label: 'Tableau de bord', icon: BarChart3 },
    { path: '/teacher/students', label: 'Étudiants', icon: Users },
    { path: '/teacher/projects', label: 'Projets', icon: FolderOpen },
    { path: '/teacher/submissions', label: 'Soumissions', icon: FileText },
    { path: '/teacher/courses', label: 'Cours', icon: BookOpen },
    { path: '/teacher/tutorials', label: 'Tutoriels', icon: Video },
    { path: '/teacher/messages', label: 'Messages', icon: MessageSquare },
    { path: '/teacher/profile', label: 'Mon Compte', icon: User },
  ];

  const currentLabel = navItems.find(item => location.pathname === item.path)?.label || 'Formateur';

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src={hacktualizLogo} alt="Hacktualiz" className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <h2 className="font-bold text-foreground text-sm">Hacktualiz</h2>
            <p className="text-xs text-muted-foreground">Espace Formateur</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
            >
              <Icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Thème</span>
          <ThemeToggle />
        </div>
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen w-full relative">
      <AnimatedBackground />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 z-20 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside
            className="w-64 h-full bg-card flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="lg:ml-64 relative z-10">
        <div className="h-16 border-b border-border/50 bg-background/40 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted/60 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
