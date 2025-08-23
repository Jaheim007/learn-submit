import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { LogOut, User, BookOpen, Upload, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export function Layout({ children, showNavigation = true }: LayoutProps) {
  const { user, signOut, isAdmin, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getNavigationItems = () => {
    if (isAdmin) {
      return [
        { label: 'Dashboard', path: '/admin', icon: BookOpen },
        { label: 'Soumissions', path: '/admin/soumissions', icon: FileText },
        { label: 'Utilisateurs', path: '/admin/users', icon: User },
        { label: 'Profil', path: '/profil', icon: User }
      ];
    }
    if (isSupervisor) {
      return [
        { label: 'Dashboard', path: '/superviseur', icon: BookOpen },
        { label: 'Soumissions', path: '/superviseur/soumissions', icon: FileText },
        { label: 'Profil', path: '/profil', icon: User }
      ];
    }
    return [
      { label: 'Mes Projets', path: '/etudiant/mes-projets', icon: BookOpen },
      { label: 'Mes Soumissions', path: '/etudiant/mes-soumissions', icon: FileText },
      { label: 'Mon Profil', path: '/profil', icon: User }
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {user && showNavigation && (
        <header className="bg-card border-b border-border shadow-custom">
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo/Title */}
              <div 
                className="flex items-center cursor-pointer transition-smooth hover:scale-105"
                onClick={() => navigate('/')}
              >
                <div className="w-8 h-8 bg-gradient-primary rounded-lg mr-3 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-foreground">
                  NYS Submissions
                </h1>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  );
                })}
                
                <NotificationBell />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </nav>

              {/* Mobile menu - simplified for now */}
              <div className="md:hidden flex items-center gap-2">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={user && showNavigation ? "pt-0" : ""}>
        {children}
      </main>
    </div>
  );
}