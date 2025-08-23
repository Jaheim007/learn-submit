import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ClassSelectionModal } from './ClassSelectionModal';
import { supabase } from '@/integrations/supabase/client';

interface ClassSelectionProviderProps {
  children: React.ReactNode;
}

export function ClassSelectionProvider({ children }: ClassSelectionProviderProps) {
  const [showModal, setShowModal] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      checkClassSelection();
    }
  }, [user, loading]);

  const checkClassSelection = async () => {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('primary_class_id')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        console.error('Error checking student class:', error);
        return;
      }

      // If student has no primary_class_id, show the modal
      if (!student?.primary_class_id) {
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error checking class selection:', error);
    }
  };

  const handleClassSelected = () => {
    setShowModal(false);
  };

  return (
    <>
      {children}
      <ClassSelectionModal 
        isOpen={showModal} 
        onClassSelected={handleClassSelected} 
      />
    </>
  );
}