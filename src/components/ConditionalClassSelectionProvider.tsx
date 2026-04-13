import React from 'react';

interface ConditionalClassSelectionProviderProps {
  children: React.ReactNode;
}

/**
 * ClassSelectionProvider has been removed.
 * Students are now assigned to classes by Admin/Academy staff.
 * This component is kept as a pass-through to avoid breaking imports.
 */
export function ConditionalClassSelectionProvider({ children }: ConditionalClassSelectionProviderProps) {
  return <>{children}</>;
}
