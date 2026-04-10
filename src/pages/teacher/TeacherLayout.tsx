import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, BarChart3, Users, FileText, BookOpen, MessageSquare, FolderOpen, User, Video, Menu, X, MoreHorizontal } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';
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

  const bottomNavItems = [
    { path: '/teacher', label: 'Accueil', icon: BarChart3 },
    { path: '/teacher/students', label: 'Étudiants', icon: Users },
    { path: '/teacher/submissions', label: 'Soumissions', icon: FileText },
    { path: '/teacher/messages', label: 'Messages', icon: MessageSquare },
  ];

  const currentLabel = navItems.find(item => location.pathname === item.path)?.label || 'Formateur';

  const isActive = (path: string) => location.pathname === path;

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
    <div className="min-h-screen min-h-[100dvh] w-full relative">
      <AnimatedBackground />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 z-20 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
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
        <div className="h-14 lg:h-16 border-b border-border/20 glass-heavy flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
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
        
        <main className="p-4 lg:p-6 pb-[88px] lg:pb-6 overscroll-y-contain">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-heavy" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="flex items-center justify-around h-[64px]">
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
