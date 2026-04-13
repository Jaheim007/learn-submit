import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, BarChart3, Users, FileText, FolderOpen, UserCheck, Settings, BookOpen, Clock, Folder, Menu, X, MoreHorizontal, History } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';
import nysLogo from '@/assets/nys-logo.png';

export default function AcademyLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/academy/login');
  };

  const navItems = [
    { path: '/academy', label: 'Tableau de bord', icon: BarChart3 },
    { path: '/academy/pending-students', label: 'Approbations', icon: Clock },
    { path: '/academy/students', label: 'Étudiants', icon: Users },
    { path: '/academy/submissions', label: 'Soumissions', icon: FileText },
    { path: '/academy/projects', label: 'Projets', icon: FolderOpen },
    { path: '/academy/courses', label: 'Cours', icon: BookOpen },
    { path: '/academy/classes', label: 'Classes', icon: Folder },
    { path: '/academy/teachers', label: 'Formateurs', icon: UserCheck },
    { path: '/academy/activity', label: 'Journal', icon: History },
    { path: '/academy/settings', label: 'Paramètres', icon: Settings },
  ];

  const bottomNavItems = [
    { path: '/academy', label: 'Accueil', icon: BarChart3 },
    { path: '/academy/students', label: 'Étudiants', icon: Users },
    { path: '/academy/submissions', label: 'Soumissions', icon: FileText },
    { path: '/academy/projects', label: 'Projets', icon: FolderOpen },
  ];

  const currentLabel = navItems.find(item => location.pathname === item.path)?.label || 'Académique';
  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src={nysLogo} alt="NYS Africa" className="h-10 w-auto" />
          <div>
            <h2 className="font-bold text-foreground">NYS Academy</h2>
            <p className="text-xs text-muted-foreground">Portail Académique</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Button
              key={item.path}
              variant={active ? "default" : "ghost"}
              className="w-full justify-start touch-manipulation active:scale-95"
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
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
        <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-muted-foreground hover:text-destructive touch-manipulation active:scale-95">
          <LogOut className="h-4 w-4 mr-3" />
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen-safe w-full relative">
      <AnimatedBackground />
      
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 z-20 flex-col">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside className="w-[280px] max-w-[85vw] h-full bg-card flex flex-col shadow-2xl animate-in slide-in-from-left duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="touch-manipulation active:scale-90">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="lg:ml-64 relative z-10">
        {/* Status bar spacer */}
        <div className="status-bar-spacer" />

        <div className="h-14 lg:h-16 border-b border-border/50 bg-card/95 lg:bg-background/40 backdrop-blur-2xl lg:backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm lg:shadow-none">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted/60 transition-all touch-manipulation active:scale-90">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-[15px] lg:text-lg font-bold lg:font-semibold text-foreground">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:block"><ThemeToggle /></div>
          </div>
        </div>
        
        <main className="p-4 lg:p-6 content-with-bottom-nav lg:pb-6 overscroll-y-contain page-enter">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-2xl border-t border-border/30 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] bottom-nav-safe">
        <div className="flex items-center justify-around h-[60px]">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-150 touch-manipulation ${active ? 'text-primary' : 'text-muted-foreground active:scale-90 active:opacity-70'}`}>
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-b-full bg-primary" />}
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] leading-none mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setSidebarOpen(true)} className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground active:scale-90 active:opacity-70 transition-all duration-150 touch-manipulation">
            <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={2} />
            <span className="text-[10px] leading-none mt-0.5 font-medium">Plus</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
