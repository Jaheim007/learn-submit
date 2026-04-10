import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Video, User } from 'lucide-react';

const navItems = [
  { path: '/etudiant/projets', label: 'Projets', icon: LayoutDashboard },
  { path: '/etudiant/soumissions', label: 'Soumissions', icon: FileText },
  { path: '/etudiant/tutoriels', label: 'Tutoriels', icon: Video },
  { path: '/etudiant/cours', label: 'Cours', icon: BookOpen },
  { path: '/etudiant/profil', label: 'Profil', icon: User },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-2xl border-t border-border/30 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-[60px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-150 touch-manipulation ${
                isActive ? 'text-primary' : 'text-muted-foreground active:scale-90 active:opacity-70'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-b-full bg-primary" />
              )}
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-150`}>
                <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute inset-0 bg-primary/15 rounded-full blur-lg scale-[2.5]" />
                )}
              </div>
              <span className={`text-[10px] leading-none mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
