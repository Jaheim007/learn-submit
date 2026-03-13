import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Trophy, User, LogOut, X } from 'lucide-react';
import hacktualzLogo from '@/assets/hacktualiz-logo-light.jpeg';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const navItems = [
  { path: '/etudiant/projets', label: 'Mes Projets', icon: LayoutDashboard },
  { path: '/etudiant/soumissions', label: 'Mes Soumissions', icon: FileText },
  { path: '/etudiant/cours', label: 'Mes Cours', icon: BookOpen },
  { path: '/etudiant/classement', label: 'Classement', icon: Trophy },
  { path: '/etudiant/profil', label: 'Mon Profil', icon: User },
];

interface StudentSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export const StudentSidebar = ({ open, onClose }: StudentSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnecté avec succès');
    navigate('/');
  };

  const handleNavClick = () => {
    onClose?.();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
        <Link to="/etudiant/projets" className="flex items-center gap-3 group" onClick={handleNavClick}>
          <img
            src={hacktualzLogo}
            alt="Hacktualiz Logo"
            className="h-9 w-9 object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
          />
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground">Hacktualiz</h1>
            <p className="text-xs text-muted-foreground">Plateforme Étudiant</p>
          </div>
        </Link>
        {/* Close button - mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }
              `}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - always visible */}
      <div className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border flex-col z-50">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar - drawer overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="fixed left-0 top-0 h-screen w-72 max-w-[85vw] bg-sidebar/98 backdrop-blur-xl border-r border-sidebar-border flex flex-col z-50 lg:hidden shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};
