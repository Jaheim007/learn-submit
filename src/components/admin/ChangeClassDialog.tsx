import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';

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
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && student) {
      loadClasses();
      // Pre-select current classes
      const currentIds = student.classes
        .map(c => c.id)
        .filter((id): id is number => id !== undefined);
      setSelectedClassIds(currentIds);
    }
  }, [open, student]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, code, title')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setAllClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classId: number) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSave = async () => {
    if (!student || selectedClassIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une classe');
      return;
    }

    setIsSubmitting(true);
    try {
      // Remove all current enrollments
      const { error: deleteError } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', student.id);

      if (deleteError) throw deleteError;

      // Insert new enrollments
      const enrollments = selectedClassIds.map(classId => ({
        student_id: student.id,
        class_id: classId,
      }));

      const { error: insertError } = await supabase
        .from('enrollments')
        .insert(enrollments);

      if (insertError) throw insertError;

      // Update primary_class_id to the first selected class
      const { error: updateError } = await supabase
        .from('students')
        .update({ primary_class_id: selectedClassIds[0] })
        .eq('id', student.id);

      if (updateError) {
        console.error('Error updating primary_class_id:', updateError);
      }

      const classNames = allClasses
        .filter(c => selectedClassIds.includes(c.id))
        .map(c => c.code)
        .join(', ');

      toast.success(`${student.full_name} est maintenant inscrit(e) dans : ${classNames}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating classes:', error);
      toast.error('Erreur lors de la mise à jour des classes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentClassCodes = student?.classes.map(c => c.code) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Gérer les classes</DialogTitle>
          <DialogDescription>
            Sélectionnez les classes auxquelles cet étudiant doit être inscrit
          </DialogDescription>
        </DialogHeader>

        {student && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{student.full_name}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Classes actuelles :</span>
              <div className="flex flex-wrap gap-1">
                {currentClassCodes.length > 0 ? (
                  currentClassCodes.map(code => (
                    <Badge key={code} variant="secondary">{code}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">Aucune</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sélectionner les classes</Label>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Chargement...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {allClasses.map((cls) => (
                      <label
                        key={cls.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedClassIds.includes(cls.id)}
                          onCheckedChange={() => toggleClass(cls.id)}
                        />
                        <span className="text-sm font-medium">{cls.code}</span>
                        <span className="text-sm text-muted-foreground">— {cls.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedClassIds.length} classe(s) sélectionnée(s)
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || selectedClassIds.length === 0}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
