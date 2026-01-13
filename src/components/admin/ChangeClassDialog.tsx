import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

interface Class {
  id: number;
  code: string;
  title: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  classes: { id?: number; code: string; title: string }[];
}

interface ChangeClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onSuccess: () => void;
}

export function ChangeClassDialog({ open, onOpenChange, student, onSuccess }: ChangeClassDialogProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadClasses();
    }
  }, [open]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, code, title')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeClass = async () => {
    if (!student || !selectedClassId) {
      toast.error('Veuillez sélectionner une classe');
      return;
    }

    const newClassId = parseInt(selectedClassId);
    
    setIsSubmitting(true);
    try {
      // First, remove old enrollment if exists
      const { error: deleteError } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', student.id);

      if (deleteError) {
        console.error('Error removing old enrollment:', deleteError);
      }

      // Add new enrollment
      const { error: insertError } = await supabase
        .from('enrollments')
        .insert({
          student_id: student.id,
          class_id: newClassId,
        });

      if (insertError) throw insertError;

      // Update primary_class_id in students table
      const { error: updateError } = await supabase
        .from('students')
        .update({ primary_class_id: newClassId })
        .eq('id', student.id);

      if (updateError) {
        console.error('Error updating primary_class_id:', updateError);
      }

      const newClass = classes.find(c => c.id === newClassId);
      toast.success(`${student.full_name} a été transféré(e) vers ${newClass?.title || 'la nouvelle classe'}`);
      onSuccess();
      onOpenChange(false);
      setSelectedClassId('');
    } catch (error) {
      console.error('Error changing class:', error);
      toast.error('Erreur lors du changement de classe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentClassCodes = student?.classes.map(c => c.code).join(', ') || 'Aucune';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Changer de classe</DialogTitle>
          <DialogDescription>
            Transférer l'étudiant vers une nouvelle classe
          </DialogDescription>
        </DialogHeader>

        {student && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{student.full_name}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Classe actuelle:</span>
              <Badge variant="secondary">{currentClassCodes}</Badge>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label>Nouvelle classe</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <div className="p-2 text-center text-muted-foreground">
                      Chargement...
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.code} - {cls.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleChangeClass} disabled={isSubmitting || !selectedClassId}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Transférer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
