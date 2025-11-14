import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { User, Mail, Phone, MessageCircle, Save, Upload, BookOpen, Github } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [profile, setProfile] = useState<StudentProfile>({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    github_profile: '',
    avatar_url: null
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchProfile();
      fetchClasses();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('full_name, email, phone, whatsapp, telegram, github_profile, avatar_url')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setProfile(data as any);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!studentData) return;

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          class_id,
          classes (code, title)
        `)
        .eq('student_id', studentData.id);

      if (enrollments) {
        const classInfo = enrollments.map((e: any) => ({
          code: e.classes.code,
          title: e.classes.title
        }));
        setClasses(classInfo);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('students')
        .update({ avatar_url: publicUrl } as any)
        .eq('user_id', user?.id);

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
      const { error } = await supabase
        .from('students')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          telegram: profile.telegram,
          github_profile: profile.github_profile
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) return <LoadingScreen />;

  return (
    <StudentDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Background */}
        <div className="relative h-48 rounded-xl overflow-hidden premium-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/30" />
          <div className="absolute inset-0 flex items-end p-6">
            <div className="flex items-end gap-6">
              <div className="relative group">
                <ProfileAvatar 
                  avatarUrl={profile.avatar_url} 
                  fullName={profile.full_name} 
                  size="xl"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                  <Upload className="h-8 w-8 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-white">{profile.full_name || 'Votre Nom'}</h1>
                <p className="text-white/80">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Section */}
        {classes.length > 0 && (
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Mes Classes</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {classes.map((cls, idx) => (
                <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                  {cls.code} - {cls.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Profile Information */}
        <div className="premium-card p-8 space-y-6">
          <h2 className="text-2xl font-bold mb-6">Informations Personnelles</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom complet
              </Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                placeholder="Votre nom complet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                placeholder="+243..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={profile.whatsapp || ''}
                onChange={(e) => setProfile({...profile, whatsapp: e.target.value})}
                placeholder="+243..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Telegram
              </Label>
              <Input
                id="telegram"
                value={profile.telegram || ''}
                onChange={(e) => setProfile({...profile, telegram: e.target.value})}
                placeholder="@username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </Label>
              <Input
                id="github"
                value={profile.github_profile || ''}
                onChange={(e) => setProfile({...profile, github_profile: e.target.value})}
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full mt-6">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </div>
    </StudentDashboardLayout>
  );
}
