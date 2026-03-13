import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Trophy, User, LogOut, X, Shield } from 'lucide-react';
import kelyaLogoBlack from '@/assets/kelya-logo-black.jpg';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';

const navItems = [
  { path: '/etudiant/projets', label: 'Mes Projets', icon: LayoutDashboard },
  { path: '/etudiant/soumissions', label: 'Mes Soumissions', icon: FileText },
  { path: '/etudiant/cours', label: 'Mes Cours', icon: BookOpen },
  { path: '/etudiant/classement', label: 'Classement', icon: Trophy },
  { path: '/etudiant/profil', label: 'Mon Compte', icon: User },
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
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {/* Logo Section */}
      <div className="relative p-5 border-b border-border/50 flex items-center justify-between">
        <Link to="/etudiant/projets" className="flex items-center gap-3 group" onClick={handleNavClick}>
          <div className="relative">
            <img
              src={kelyaLogoBlack}
              alt="Kelya Group"
              className="h-10 w-10 object-cover rounded-xl transition-all duration-300 group-hover:scale-105 ring-2 ring-border/50 group-hover:ring-primary/30"
            />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-background" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">Kelya Group</h1>
            <p className="text-[11px] text-muted-foreground font-medium">Espace Étudiant</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 relative">
        <div className="px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Menu</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }
              `}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
              <span className="text-[13px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Access + Sign Out */}
      <div className="p-3 border-t border-border/50 space-y-1 relative">
        {isAdmin && (
          <Link
            to="/admin"
            onClick={handleNavClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 group"
          >
            <Shield className="h-[18px] w-[18px] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[13px] font-medium">Administration</span>
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200 group"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[13px] font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 h-screen w-[260px] bg-background/80 backdrop-blur-xl border-r border-border/40 flex-col z-50">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {open && (
        <>
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-40 lg:hidden" onClick={onClose} />
          <div className="fixed left-0 top-0 h-screen w-[280px] max-w-[85vw] bg-background border-r border-border/40 flex flex-col z-50 lg:hidden shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};
