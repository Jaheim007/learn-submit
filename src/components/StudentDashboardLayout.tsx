import { ReactNode, useState, useEffect } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationBell } from './NotificationBell';
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
      supabase.from('students').select('full_name, avatar_url').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data as any); });
    }
  }, [user]);

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-60">
        {/* Top Bar */}
        <div className="h-14 border-b border-border bg-background flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="lg:hidden flex-1 flex justify-center">
            <span className="text-sm font-semibold text-foreground">Kelya Group</span>
          </div>

          <div className="hidden lg:flex flex-1" />

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={() => navigate('/etudiant/profil')}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <ProfileAvatar
                avatarUrl={profile?.avatar_url}
                fullName={profile?.full_name || 'Étudiant'}
                size="sm"
              />
            </button>
          </div>
        </div>

        {/* Page Content — add bottom padding on mobile for bottom nav */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
