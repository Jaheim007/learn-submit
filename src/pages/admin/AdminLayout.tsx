import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import kelyaLogo from '@/assets/kelya-logo-black.jpg';
import hacktualiz from '@/assets/hacktualiz-logo-dark.png';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Settings,
  BookOpen,
  Clock,
  UserCog,
  GraduationCap,
  LogOut,
  Mail,
  ArrowLeft,
  Layers
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { name: 'Étudiants', href: '/admin/students', icon: Users },
  { name: 'Classes', href: '/admin/classes', icon: Layers },
  { name: 'Soumissions', href: '/admin/submissions', icon: FileText },
  { name: 'Projets', href: '/admin/projects', icon: FolderOpen },
  { name: 'Cours', href: '/admin/courses', icon: BookOpen },
  { name: 'Superviseurs', href: '/admin/users', icon: UserCog },
  { name: 'Personnel académique', href: '/admin/academy-users', icon: GraduationCap },
  { name: 'Emails', href: '/admin/emails', icon: Mail },
  { name: 'Paramètres', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-60 bg-[hsl(230,30%,10%)] text-white flex flex-col z-30">
        {/* Brand */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <img src={kelyaLogo} alt="Kelya" className="h-7 w-7 rounded object-cover" />
          <span className="text-xs text-white/40 mx-0.5">×</span>
          <img src={hacktualiz} alt="Hacktualiz" className="h-7 rounded object-cover" />
          <div className="ml-auto">
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">Admin</span>
          </div>
        </div>

        {/* Back link */}
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au portail
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors w-full"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-60">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
