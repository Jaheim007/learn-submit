import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Mail, Phone, Shield, Save, BookOpen } from 'lucide-react';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
}

export default function TeacherProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({ full_name: '', email: '', phone: '' });
  const [assignedClasses, setAssignedClasses] = useState<{ code: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const [{ data: profileData }, { data: assignments }] = await Promise.all([
        supabase.from('profiles').select('full_name, email, phone').eq('id', user!.id).single(),
        supabase
          .from('supervisor_class_assignments')
          .select('classes(code, title)')
          .eq('supervisor_user_id', user!.id),
      ]);

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || user!.email || '',
          phone: profileData.phone || '',
        });
      }

      setAssignedClasses(
        (assignments || []).map(a => ({
          code: (a.classes as any)?.code || '',
          title: (a.classes as any)?.title || '',
        }))
      );
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim(),
        })
        .eq('id', user!.id);

      if (error) throw error;
      toast.success('Profil mis à jour');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[800px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mon Compte</h1>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Mettez à jour vos coordonnées</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Nom complet
            </Label>
            <Input
              value={profile.full_name}
              onChange={e => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Votre nom complet"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <Input value={profile.email} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> Téléphone
            </Label>
            <Input
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+225 XX XX XX XX"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </CardContent>
      </Card>

      {/* Role & Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Rôle & Classes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rôle :</span>
            <Badge>Formateur</Badge>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Classes assignées
            </p>
            {assignedClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune classe assignée</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedClasses.map(c => (
                  <Badge key={c.code} variant="outline">
                    {c.code} — {c.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
