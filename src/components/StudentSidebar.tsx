import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Trophy, User, LogOut, X, Shield } from 'lucide-react';
import kelyaLogo from '@/assets/kelya-logo-red.jpg';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';

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
  const { isAdmin } = useRoles();

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
      <div className="p-5 border-b border-border flex items-center justify-between">
        <Link to="/etudiant/projets" className="flex items-center gap-3 group" onClick={handleNavClick}>
          <img
            src={kelyaLogo}
            alt="Kelya Group"
            className="h-9 w-9 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
          />
          <div>
            <h1 className="text-sm font-bold text-foreground">Kelya Group</h1>
            <p className="text-xs text-muted-foreground">Espace Étudiant</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-foreground hover:bg-muted transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Access + Sign Out */}
      <div className="p-3 border-t border-border space-y-0.5">
        {isAdmin && (
          <Link
            to="/admin"
            onClick={handleNavClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
          >
            <Shield className="h-4.5 w-4.5 shrink-0" />
            <span className="text-sm font-medium">Administration</span>
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span className="text-sm">Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-background border-r border-border flex-col z-50">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {open && (
        <>
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
          <div className="fixed left-0 top-0 h-screen w-64 max-w-[80vw] bg-background border-r border-border flex flex-col z-50 lg:hidden shadow-xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};
