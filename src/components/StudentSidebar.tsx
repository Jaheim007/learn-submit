import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Trophy, User, LogOut } from 'lucide-react';
import nysLogo from '@/assets/nys-logo.png';
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

export const StudentSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnecté avec succès');
    navigate('/');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/etudiant/projets" className="flex items-center gap-3 group">
          <img 
            src={nysLogo} 
            alt="NYS Logo" 
            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
          />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">NYS Africa</h1>
            <p className="text-xs text-muted-foreground">Plateforme Étudiant</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
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
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};
