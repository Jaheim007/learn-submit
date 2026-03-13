import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Trophy, User } from 'lucide-react';

const navItems = [
  { path: '/etudiant/projets', label: 'Projets', icon: LayoutDashboard },
  { path: '/etudiant/soumissions', label: 'Soumissions', icon: FileText },
  { path: '/etudiant/cours', label: 'Cours', icon: BookOpen },
  { path: '/etudiant/classement', label: 'Classement', icon: Trophy },
  { path: '/etudiant/profil', label: 'Profil', icon: User },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
