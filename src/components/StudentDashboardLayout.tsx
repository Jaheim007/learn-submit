import { ReactNode, useState, useEffect } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { NotificationBell } from './NotificationBell';
import { AnimatedBackground } from './AnimatedBackground';
import { ProfileAvatar } from './ProfileAvatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface StudentDashboardLayoutProps {
  children: ReactNode;
}

export const StudentDashboardLayout = ({ children }: StudentDashboardLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);

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
      
      <StudentSidebar />
      
      {/* Main Content Area */}
      <div className="ml-64 relative z-10">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 bg-background/40 backdrop-blur-xl flex items-center justify-end px-6 gap-4">
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
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
