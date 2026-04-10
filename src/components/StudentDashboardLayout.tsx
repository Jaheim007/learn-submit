import { ReactNode, useState, useEffect } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationBell } from './NotificationBell';
import { ProfileAvatar } from './ProfileAvatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface StudentDashboardLayoutProps {
  children: ReactNode;
}

export const StudentDashboardLayout = ({ children }: StudentDashboardLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('students').select('full_name, avatar_url').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data as any); });
    }
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-[260px]">
        {/* Top Bar — glassmorphism */}
        <div className="h-16 bg-background/70 backdrop-blur-xl border-b border-border/40 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 -ml-1 rounded-xl text-foreground hover:bg-muted/60 transition-all active:scale-95"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile center brand */}
          <div className="lg:hidden flex-1 flex justify-center">
            <span className="text-sm font-bold text-foreground tracking-tight">Hacktualiz</span>
          </div>

          {/* Desktop greeting */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {greeting()}, <span className="font-semibold text-foreground">{profile?.full_name?.split(' ')[0] || 'Étudiant'}</span> 👋
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={() => navigate('/etudiant/profil')}
              className="hover:opacity-80 transition-all cursor-pointer active:scale-95 rounded-full ring-2 ring-transparent hover:ring-primary/20"
            >
              <ProfileAvatar
                avatarUrl={profile?.avatar_url}
                fullName={profile?.full_name || 'Étudiant'}
                size="sm"
              />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
