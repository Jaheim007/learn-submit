import { ReactNode, useState, useEffect } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { NotificationBell } from './NotificationBell';
import { AnimatedBackground } from './AnimatedBackground';
import { ProfileAvatar } from './ProfileAvatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

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
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('students')
      .select('full_name, avatar_url')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setProfile(data as any);
    }
  };

  return (
    <div className="min-h-screen w-full relative">
      <AnimatedBackground />

      <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:ml-64 relative z-10">
        {/* Top Bar */}
        <div className="h-14 lg:h-16 border-b border-border/50 bg-background/40 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 gap-4 sticky top-0 z-30">
          {/* Hamburger - mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile: show NYS branding in center */}
          <div className="lg:hidden flex-1 flex justify-center">
            <span className="text-sm font-semibold text-foreground">NYS Africa</span>
          </div>

          {/* Desktop: spacer */}
          <div className="hidden lg:flex flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={() => navigate('/etudiant/profil')}
              className="hover:scale-110 transition-transform cursor-pointer"
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
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
