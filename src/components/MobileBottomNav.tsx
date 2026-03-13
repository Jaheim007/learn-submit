import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Trophy, User } from 'lucide-react';

const navItems = [
  { path: '/etudiant/projets', label: 'Projets', icon: LayoutDashboard },
  { path: '/etudiant/soumissions', label: 'Soumissions', icon: FileText },
  { path: '/etudiant/cours', label: 'Cours', icon: BookOpen },
  { path: '/etudiant/classement', label: 'Rang', icon: Trophy },
  { path: '/etudiant/profil', label: 'Profil', icon: User },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/80 backdrop-blur-xl border-t border-border/40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground active:scale-95'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
