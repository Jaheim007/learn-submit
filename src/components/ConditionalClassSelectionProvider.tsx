import { useLocation } from 'react-router-dom';
import { ClassSelectionProvider } from './ClassSelectionProvider';

interface ConditionalClassSelectionProviderProps {
  children: React.ReactNode;
}

export function ConditionalClassSelectionProvider({ children }: ConditionalClassSelectionProviderProps) {
  const location = useLocation();
  
  // Don't show class selection on admin or supervisor routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSupervisorRoute = location.pathname.startsWith('/superviseur');
  
  if (isAdminRoute || isSupervisorRoute) {
    return <>{children}</>;
  }
  
  return (
    <ClassSelectionProvider>
      {children}
    </ClassSelectionProvider>
  );
}