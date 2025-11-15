import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, Plus } from 'lucide-react';

export default function AdminAcademyUsers() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

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
      
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erreur inattendue lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestion du Personnel Académique</h1>
        <p className="text-muted-foreground mt-2">
          Créer et gérer les comptes du personnel académique
        </p>
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
    </div>
  );
}
