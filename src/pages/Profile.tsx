import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import {
  User, Mail, Phone, MessageCircle, Save, Upload, BookOpen, Github,
  ChevronRight, LogOut, Moon, Sun, Shield, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useRoles } from '@/hooks/useRoles';

interface StudentProfile {
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  telegram: string | null;
  github_profile: string | null;
  avatar_url: string | null;
}

interface ClassInfo {
  code: string;
  title: string;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useRoles();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [profile, setProfile] = useState<StudentProfile>({
    full_name: '', email: '', phone: '', whatsapp: '', telegram: '', github_profile: '', avatar_url: null
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchProfile();
      fetchClasses();
    }
  }, [user, authLoading]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('full_name, email, phone, whatsapp, telegram, github_profile, avatar_url')
        .eq('user_id', user?.id)
        .single();
      if (data) setProfile(data as any);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data: studentData } = await supabase
        .from('students').select('id').eq('user_id', user?.id).single();
      if (!studentData) return;
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id, classes (code, title)')
        .eq('student_id', studentData.id);
      if (enrollments) {
        setClasses(enrollments.map((e: any) => ({ code: e.classes.code, title: e.classes.title })));
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Veuillez sélectionner une image'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 2MB"); return; }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('students').update({ avatar_url: publicUrl } as any).eq('user_id', user?.id);
      if (updateError) throw updateError;
      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Avatar mis à jour');
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('students').update({
        full_name: profile.full_name, phone: profile.phone,
        whatsapp: profile.whatsapp, telegram: profile.telegram, github_profile: profile.github_profile
      }).eq('user_id', user?.id);
      if (error) throw error;
      toast.success('Profil mis à jour');
      setEditMode(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnecté avec succès');
    navigate('/');
  };

  if (loading || authLoading) return <LoadingScreen />;

  return (
    <StudentDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Page Title */}
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Mon Compte</h1>

        {/* Profile Header Card */}
        <div className="bg-card rounded-2xl border border-border/60 p-6 flex flex-col items-center text-center">
          <div className="relative group mb-4">
            <ProfileAvatar avatarUrl={profile.avatar_url} fullName={profile.full_name} size="xl" />
            <label className="absolute inset-0 flex items-center justify-center bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
              <Upload className="h-5 w-5 text-background" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <h2 className="text-lg font-bold text-foreground">{profile.full_name || 'Votre Nom'}</h2>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          {classes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
              {classes.map((cls, idx) => (
                <Badge key={idx} variant="outline" className="text-[11px] px-2.5 py-0.5 rounded-lg">
                  {cls.code}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">
          {/* Edit Profile */}
          <button
            onClick={() => setEditMode(!editMode)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Modifier le profil</p>
              <p className="text-xs text-muted-foreground">Nom, téléphone, liens sociaux</p>
            </div>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${editMode ? 'rotate-90' : ''}`} />
          </button>

          {/* Dark Mode */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
              {darkMode ? <Moon className="h-4 w-4 text-foreground" /> : <Sun className="h-4 w-4 text-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Mode sombre</p>
              <p className="text-xs text-muted-foreground">Changer l'apparence</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>

          {/* Classes */}
          {classes.length > 0 && (
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Mes Classes</p>
                <p className="text-xs text-muted-foreground">{classes.map(c => c.code).join(', ')}</p>
              </div>
            </div>
          )}

          {/* Admin */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Administration</p>
                <p className="text-xs text-muted-foreground">Accéder au panneau admin</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-destructive/5 transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">Déconnexion</p>
              <p className="text-xs text-muted-foreground">Se déconnecter du compte</p>
            </div>
          </button>
        </div>

        {/* Editable Profile Fields (collapsible) */}
        {editMode && (
          <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <h3 className="text-base font-bold text-foreground">Informations Personnelles</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="flex items-center gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5" /> Nom complet
                </Label>
                <Input id="full_name" value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  placeholder="Votre nom complet" className="h-10 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input id="email" value={profile.email} disabled className="opacity-50 h-10 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5" /> Téléphone
                </Label>
                <Input id="phone" value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  placeholder="+243..." className="h-10 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="flex items-center gap-1.5 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Label>
                <Input id="whatsapp" value={profile.whatsapp || ''}
                  onChange={(e) => setProfile({...profile, whatsapp: e.target.value})}
                  placeholder="+243..." className="h-10 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telegram" className="flex items-center gap-1.5 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" /> Telegram
                </Label>
                <Input id="telegram" value={profile.telegram || ''}
                  onChange={(e) => setProfile({...profile, telegram: e.target.value})}
                  placeholder="@username" className="h-10 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="github" className="flex items-center gap-1.5 text-xs">
                  <Github className="h-3.5 w-3.5" /> GitHub
                </Label>
                <Input id="github" value={profile.github_profile || ''}
                  onChange={(e) => setProfile({...profile, github_profile: e.target.value})}
                  placeholder="https://github.com/username" className="h-10 rounded-xl" />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full h-10 rounded-xl font-semibold">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        )}
      </div>
    </StudentDashboardLayout>
  );
}
