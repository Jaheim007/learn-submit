import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Class {
  id: number;
  code: string;
  title: string;
}

interface ClassSelectionModalProps {
  isOpen: boolean;
  onClassSelected: () => void;
}

export function ClassSelectionModal({ isOpen, onClassSelected }: ClassSelectionModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, code, title')
        .in('code', ['G1', 'G2', 'G3', 'G4', 'G5'])
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Erreur lors du chargement des groupes de classe');
    }
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      setError('Veuillez sélectionner un groupe de classe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Get student ID
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw studentError;

      // Update student with primary_class_id
      const { error: updateError } = await supabase
        .from('students')
        .update({ primary_class_id: parseInt(selectedClassId) })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Create enrollment
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: student.id,
          class_id: parseInt(selectedClassId)
        });

      if (enrollmentError) throw enrollmentError;

      toast({
        title: "Groupe sélectionné",
        description: "Votre groupe de classe a été défini avec succès.",
      });

      onClassSelected();
    } catch (error) {
      console.error('Error selecting class:', error);
      setError('Erreur lors de la sélection du groupe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>.lucide-x]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Sélection du groupe de classe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sélectionnez votre groupe. Ce choix est définitif et ne pourra pas être modifié.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="class-select">Choisissez votre groupe de classe</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un groupe..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedClassId}
            className="w-full"
          >
            {loading ? 'Enregistrement...' : 'Confirmer la sélection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}