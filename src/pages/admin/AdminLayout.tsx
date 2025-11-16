import { ReactNode } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Settings,
  BookOpen,
  Clock,
  Briefcase,
  UserCog,
  GraduationCap
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { name: 'En attente', href: '/admin/pending-students', icon: Clock, badge: 'pending' },
  { name: 'Étudiants', href: '/admin/students', icon: Users },
  { name: 'Soumissions', href: '/admin/submissions', icon: FileText },
  { name: 'Projets', href: '/admin/projects', icon: FolderOpen },
  { name: 'Cours', href: '/admin/courses', icon: BookOpen },
  { name: 'Offres d\'emploi', href: '/admin/jobs', icon: Briefcase },
  { name: 'Formateurs', href: '/admin/users', icon: UserCog },
  { name: 'Personnel Académique', href: '/admin/academy-users', icon: GraduationCap },
  { name: 'Paramètres', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Admin NYS</h1>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {item.badge === 'pending' && (
                  <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                    !
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
