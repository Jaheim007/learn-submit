import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AcademyUser {
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export default function AdminAcademyUsers() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [academyUsers, setAcademyUsers] = useState<AcademyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    loadAcademyUsers();
  }, []);

  const loadAcademyUsers = async () => {
    try {
      const { data: academyRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'academy');

      if (!academyRoles || academyRoles.length === 0) {
        setAcademyUsers([]);
        setLoadingUsers(false);
        return;
      }

      const userIds = academyRoles.map(r => r.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .in('id', userIds)
        .order('created_at', { ascending: false });

      setAcademyUsers((profiles || []).map(p => ({
        user_id: p.id,
        full_name: p.full_name || '',
        email: p.email,
        created_at: p.created_at,
      })));
    } catch (error) {
      console.error('Error loading academy users:', error);
      toast.error('Erreur lors du chargement des utilisateurs académiques');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateAcademyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-academy-user', {
        body: {
          email: email.trim(),
          password,
          full_name: fullName.trim(),
        },
      });

      if (error) {
        console.error('Error creating academy user:', error);
        toast.error(error.message || 'Erreur lors de la création du compte académique');
        return;
      }

      if (data?.error) {
        console.error('Server error:', data.error);
        toast.error(data.error);
        return;
      }

      toast.success('Compte académique créé avec succès');
      
      // Reset form and reload list
      setEmail('');
      setPassword('');
      setFullName('');
      loadAcademyUsers();
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erreur inattendue lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion du Personnel Académique</h1>
          <p className="text-muted-foreground mt-2">
            Créer et gérer les comptes du personnel académique
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {academyUsers.length} {academyUsers.length > 1 ? 'comptes' : 'compte'}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Academy User Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <CardTitle>Créer un compte académique</CardTitle>
            </div>
            <CardDescription>
              Ajoutez un nouveau membre au personnel académique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAcademyUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@nys-africa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe temporaire</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  L'utilisateur pourra changer ce mot de passe après connexion
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Création en cours...' : 'Créer le compte'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <CardTitle>Rôle Académique</CardTitle>
            </div>
            <CardDescription>
              Informations sur les privilèges académiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Accès et permissions</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Approuver les nouveaux étudiants</li>
                <li>• Gérer les classes et projets</li>
                <li>• Superviser les soumissions</li>
                <li>• Créer et gérer le contenu des cours</li>
                <li>• Gérer les formateurs</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Portail de connexion</h4>
              <p className="text-sm text-muted-foreground">
                Les utilisateurs académiques se connectent via :
              </p>
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                /academy/login
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academy Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Personnel académique existant</CardTitle>
          <CardDescription>Liste de tous les comptes académiques créés</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
            </div>
          ) : academyUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun compte académique créé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Créé le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academyUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
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
