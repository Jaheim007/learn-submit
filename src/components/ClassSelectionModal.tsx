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
        .select('id, code, title, session_name')
        .eq('is_open_for_signup', true)
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setClasses(data || []);
      
      if (!data || data.length === 0) {
        setError('Aucun groupe ouvert aux inscriptions pour le moment.');
      }
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Utilisateur non connecté');

      const response = await fetch(`https://ucgaxcnfvrbhsxxcwceo.supabase.co/functions/v1/choose-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZ2F4Y25mdnJiaHN4eGN3Y2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDc1OTMsImV4cCI6MjA2NzAyMzU5M30.qPKuBuirq3kJI36BhoA_6IO_usl6iGt6QA2qWV_Sv4o',
        },
        body: JSON.stringify({
          class_id: parseInt(selectedClassId)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = 'Erreur lors de la sélection du groupe';
        
        if (response.status === 400) {
          errorMessage = 'Sélection invalide.';
        } else if (response.status === 403) {
          errorMessage = 'Votre groupe est définitif et ne peut pas être modifié.';
        } else if (response.status === 409 || response.status === 500) {
          errorMessage = 'Impossible d\'enregistrer votre groupe, veuillez réessayer.';
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Groupe sélectionné",
        description: "Votre groupe de classe a été défini avec succès.",
      });

      onClassSelected();
    } catch (error) {
      console.error('Error selecting class:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la sélection du groupe');
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
              Choisissez votre groupe . Ce choix est définitif.
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