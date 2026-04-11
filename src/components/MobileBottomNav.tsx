import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Video, User } from 'lucide-react';
import { motion } from 'framer-motion';

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
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-heavy bottom-nav-safe"
    >
      {/* Top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="flex items-center justify-around h-[60px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 touch-manipulation ${
                isActive ? 'text-primary' : 'text-muted-foreground active:scale-90 active:opacity-70'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                className="relative"
                animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-primary/15 rounded-full blur-xl scale-[3]"
                  />
                )}
              </motion.div>
              <span className={`text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium opacity-80'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
