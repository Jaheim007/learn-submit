import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Folder } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Class {
  id: number;
  code: string;
  title: string;
  description: string | null;
  is_active: boolean;
  is_open_for_signup: boolean;
  session_name: string | null;
  signup_deadline: string | null;
  created_at: string;
}

export default function AcademyClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    session_name: '',
    signup_deadline: '',
    is_open_for_signup: true,
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('classes')
        .insert({
          code: formData.code.trim(),
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          session_name: formData.session_name.trim() || null,
          signup_deadline: formData.signup_deadline || null,
          is_open_for_signup: formData.is_open_for_signup,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Classe créée avec succès');
      setDialogOpen(false);
      setFormData({
        code: '',
        title: '',
        description: '',
        session_name: '',
        signup_deadline: '',
        is_open_for_signup: true,
      });
      loadClasses();
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast.error(error.message || 'Erreur lors de la création de la classe');
    } finally {
      setLoading(false);
    }
  };

  const toggleClassStatus = async (classId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: !currentStatus })
        .eq('id', classId);

      if (error) throw error;

      toast.success(currentStatus ? 'Classe désactivée' : 'Classe activée');
      loadClasses();
    } catch (error: any) {
      console.error('Error toggling class status:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  const toggleSignupStatus = async (classId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_open_for_signup: !currentStatus })
        .eq('id', classId);

      if (error) throw error;

      toast.success(currentStatus ? 'Inscription fermée' : 'Inscription ouverte');
      loadClasses();
    } catch (error: any) {
      console.error('Error toggling signup status:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Classes</h1>
          <p className="text-muted-foreground mt-2">
            Créer et gérer les classes de formation
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {classes.length} {classes.length > 1 ? 'classes' : 'classe'}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle classe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle classe</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle classe de formation
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code de la classe *</Label>
                    <Input
                      id="code"
                      placeholder="Ex: VBC-2024"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session_name">Nom de session</Label>
                    <Input
                      id="session_name"
                      placeholder="Ex: Session 2"
                      value={formData.session_name}
                      onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la classe *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: VibeCoding - Développement Web"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description de la classe..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup_deadline">Date limite d'inscription</Label>
                  <Input
                    id="signup_deadline"
                    type="datetime-local"
                    value={formData.signup_deadline}
                    onChange={(e) => setFormData({ ...formData, signup_deadline: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_open_for_signup"
                    checked={formData.is_open_for_signup}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_open_for_signup: checked })}
                    disabled={loading}
                  />
                  <Label htmlFor="is_open_for_signup">Ouvrir aux inscriptions</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Création...' : 'Créer la classe'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classes existantes</CardTitle>
          <CardDescription>Liste de toutes les classes créées</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune classe créée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead>Créée le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.code}</TableCell>
                    <TableCell>{cls.title}</TableCell>
                    <TableCell>{cls.session_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cls.is_open_for_signup}
                          onCheckedChange={() => toggleSignupStatus(cls.id, cls.is_open_for_signup)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {cls.is_open_for_signup ? 'Ouverte' : 'Fermée'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cls.is_active}
                          onCheckedChange={() => toggleClassStatus(cls.id, cls.is_active)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {cls.is_active ? 'Oui' : 'Non'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(cls.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
