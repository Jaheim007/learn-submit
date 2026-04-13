import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Mail, Phone, Shield, Save, BookOpen, ChevronRight, Moon, Sun, LogOut, Bell, HelpCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

export default function TeacherProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
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
        supabase.from('supervisor_class_assignments').select('classes(code, title)').eq('supervisor_user_id', user!.id),
      ]);
      if (profileData) {
        setProfile({ full_name: profileData.full_name || '', email: profileData.email || user!.email || '', phone: profileData.phone || '' });
      }
      setAssignedClasses((assignments || []).map(a => ({ code: (a.classes as any)?.code || '', title: (a.classes as any)?.title || '' })));
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: profile.full_name.trim(), phone: profile.phone.trim() }).eq('id', user!.id);
      if (error) throw error;
      toast.success('Profil mis à jour');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/teacher/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[600px] mx-auto">
      {/* Profile Header */}
      <motion.div variants={item} className="flex flex-col items-center text-center pt-4">
        <ProfileAvatar avatarUrl={null} fullName={profile.full_name || 'Formateur'} size="lg" />
        <h2 className="text-xl font-bold text-foreground mt-3 font-heading">{profile.full_name || 'Formateur'}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{profile.email}</p>
        <Badge className="mt-2 rounded-full">Formateur</Badge>
      </motion.div>

      {/* Personal Info Section */}
      <motion.div variants={item} className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border/20">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informations personnelles</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><User className="h-3 w-3" /> Nom complet</Label>
            <Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} placeholder="Votre nom" className="rounded-xl h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</Label>
            <Input value={profile.email} disabled className="bg-muted/30 rounded-xl h-11" />
            <p className="text-[11px] text-muted-foreground/60">L'email ne peut pas être modifié</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> Téléphone</Label>
            <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+225 XX XX XX XX" className="rounded-xl h-11" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-11 touch-manipulation active:scale-[0.97]">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </motion.div>

      {/* Classes Section */}
      <motion.div variants={item} className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border/20">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classes assignées</h3>
        </div>
        <div className="divide-y divide-border/20">
          {assignedClasses.length === 0 ? (
            <div className="p-5 text-center text-sm text-muted-foreground">Aucune classe assignée</div>
          ) : (
            assignedClasses.map(c => (
              <div key={c.code} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.code}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.title}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Settings Section */}
      <motion.div variants={item} className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border/20">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Préférences</h3>
        </div>
        <div className="divide-y divide-border/20">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors touch-manipulation active:bg-muted/50">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              {theme === 'dark' ? <Moon className="h-4 w-4 text-amber-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Apparence</p>
              <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </button>
          <button onClick={() => navigate('/teacher/messages')} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors touch-manipulation active:bg-muted/50">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Bell className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Notifications & Messages</p>
              <p className="text-xs text-muted-foreground">Gérer vos notifications</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </button>
        </div>
      </motion.div>

      {/* About & Support */}
      <motion.div variants={item} className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="divide-y divide-border/20">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="h-9 w-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">À propos</p>
              <p className="text-xs text-muted-foreground">Hacktualiz v2.0 — LMS Platform</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sign out */}
      <motion.div variants={item}>
        <button onClick={handleSignOut} className="w-full rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-center gap-2 text-destructive font-medium text-sm hover:bg-destructive/10 transition-colors touch-manipulation active:scale-[0.98]">
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </motion.div>

      <div className="h-4" />
    </motion.div>
  );
}
