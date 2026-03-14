import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import kelyaLogoBlack from '@/assets/kelya-logo-black.jpg';
import hacktualiz from '@/assets/hacktualiz-logo-dark.png';
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
  Layers
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const navigation = [
  { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { name: 'Étudiants', href: '/admin/students', icon: Users },
  { name: 'Classes', href: '/admin/classes', icon: Layers },
  { name: 'Soumissions', href: '/admin/submissions', icon: FileText },
  { name: 'Projets', href: '/admin/projects', icon: FolderOpen },
  { name: 'Cours', href: '/admin/courses', icon: BookOpen },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Emails', href: '/admin/emails', icon: Mail },
  { name: 'Paramètres', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — matching student sidebar style */}
      <div className="fixed inset-y-0 left-0 w-[220px] bg-card border-r border-border flex flex-col z-30">
        {/* Subtle gradient overlay like student sidebar */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        {/* Brand */}
        <div className="relative p-5 border-b border-border/50">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src={kelyaLogoBlack}
                alt="Kelya"
                className="h-10 w-10 object-cover rounded-xl transition-all duration-300 group-hover:scale-105 ring-2 ring-border/50 group-hover:ring-primary/30"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">
                Kelya <span className="text-muted-foreground font-normal">×</span> Hacktualiz
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium">Administration</p>
            </div>
          </Link>
        </div>

        {/* Back link */}
        <Link
          to="/"
          className="flex items-center gap-2.5 mx-3 mt-3 mb-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au portail
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            const isExactAdmin = item.href === '/admin' && location.pathname === '/admin';
            const active = item.href === '/admin' ? isExactAdmin : isActive;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border/50 space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-muted-foreground">Thème</span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all w-full"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content — generous padding for breathing room */}
      <div className="ml-[220px]">
        <div className="p-8 lg:p-10 max-w-[1400px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
