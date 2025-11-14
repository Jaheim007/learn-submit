import { ReactNode } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { NotificationBell } from './NotificationBell';
import { AnimatedBackground } from './AnimatedBackground';

interface StudentDashboardLayoutProps {
  children: ReactNode;
}

export const StudentDashboardLayout = ({ children }: StudentDashboardLayoutProps) => {
  return (
    <div className="min-h-screen w-full relative">
      <AnimatedBackground />
      
      <StudentSidebar />
      
      {/* Main Content Area */}
      <div className="ml-64 relative z-10">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 bg-background/40 backdrop-blur-xl flex items-center justify-end px-6">
          <NotificationBell />
        </div>
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
