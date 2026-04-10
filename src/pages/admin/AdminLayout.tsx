import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import hacktualizLogo from '@/assets/hacktualiz-main-logo.jpeg';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Settings,
  BookOpen,
  LogOut,
  Mail,
  ArrowLeft,
  Layers,
  Menu,
  X,
  Clock,
  Video,
  MoreHorizontal
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const navigation = [
  { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { name: 'En attente', href: '/admin/pending-students', icon: Clock },
  { name: 'Étudiants', href: '/admin/students', icon: Users },
  { name: 'Classes', href: '/admin/classes', icon: Layers },
  { name: 'Soumissions', href: '/admin/submissions', icon: FileText },
  { name: 'Projets', href: '/admin/projects', icon: FolderOpen },
  { name: 'Cours', href: '/admin/courses', icon: BookOpen },
  { name: 'Tutoriels', href: '/admin/tutorials', icon: Video },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Emails', href: '/admin/emails', icon: Mail },
  { name: 'Paramètres', href: '/admin/settings', icon: Settings },
];

// Bottom nav items for mobile (top 4 + more)
const bottomNavItems = [
  { name: 'Accueil', href: '/admin', icon: LayoutDashboard },
  { name: 'Étudiants', href: '/admin/students', icon: Users },
  { name: 'Soumissions', href: '/admin/submissions', icon: FileText },
  { name: 'Projets', href: '/admin/projects', icon: FolderOpen },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const currentLabel = navigation.find(item => {
    if (item.href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(item.href);
  })?.name || 'Administration';

  const isNavActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="relative p-5 border-b border-border/50">
        <Link to="/admin" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
          <div className="relative">
            <img src={hacktualizLogo} alt="Hacktualiz" className="h-10 w-10 object-cover rounded-xl transition-all duration-300 group-hover:scale-105 ring-2 ring-border/50 group-hover:ring-primary/30" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">Hacktualiz</h1>
            <p className="text-[11px] text-muted-foreground font-medium">Administration</p>
          </div>
        </Link>
      </div>
      <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 mx-3 mt-3 mb-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-all">
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour au portail
      </Link>
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overscroll-contain">
        {navigation.map((item) => {
          const active = isNavActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation active:scale-95',
                active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border/50 space-y-1">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-muted-foreground">Thème</span>
          <ThemeToggle />
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all w-full touch-manipulation active:scale-95">
          <LogOut className="h-[18px] w-[18px]" />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[220px] bg-card border-r border-border flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-card flex flex-col shadow-2xl animate-in slide-in-from-left duration-200" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground z-50 touch-manipulation active:scale-90">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-[220px]">
        {/* Mobile top bar - native style */}
        <div className="lg:hidden h-14 border-b border-border/20 glass-heavy flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-foreground hover:bg-muted/60 transition-all touch-manipulation active:scale-90">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-[15px] font-bold text-foreground">{currentLabel}</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:block h-14 border-b border-border glass-heavy sticky top-0 z-30">
          <div className="h-full flex items-center justify-between px-8 max-w-[1400px]">
            <h1 className="text-lg font-semibold text-foreground">{currentLabel}</h1>
            <ThemeToggle />
          </div>
        </div>

        <div className="p-4 lg:p-8 xl:p-10 pb-[88px] lg:pb-10 max-w-[1400px] overscroll-y-contain">
          <Outlet />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-heavy" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="flex items-center justify-around h-[64px]">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(item.href);
            return (
              <Link key={item.href} to={item.href} className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 touch-manipulation ${isActive ? 'text-primary' : 'text-muted-foreground active:scale-90 active:opacity-70'}`}>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-b-full bg-primary" />}
                <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] leading-none mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
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
