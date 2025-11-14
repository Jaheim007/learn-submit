import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Phone, MessageCircle, Send, Github, Save, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cleanClassName } from '@/lib/utils';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { LoadingScreen } from '@/components/LoadingScreen';
import { NotificationBell } from '@/components/NotificationBell';
import nysLogo from '@/assets/nys-logo.png';

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  github_profile: string;
  primary_class_id?: number;
  primary_class?: {
    code: string;
    title: string;
  };
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<StudentProfile>({
    id: '',
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    github_profile: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          primary_class:classes!primary_class_id (
            code,
            title
          )
        `)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching student classes:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le profil",
          variant: "destructive"
        });
        navigate('/etudiant/register');
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          telegram: data.telegram || '',
          github_profile: data.github_profile || '',
          primary_class_id: data.primary_class_id,
          primary_class: data.primary_class
        });
      } else {
        // No student profile found, redirect to registration
        navigate('/etudiant/register');
        return;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil",
        variant: "destructive"
      });
      navigate('/etudiant/register');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          telegram: profile.telegram,
          github_profile: profile.github_profile
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof StudentProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Premium Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={nysLogo} alt="NYS" className="h-10 w-10 object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/etudiant/projets" className="text-white/70 hover:text-white transition-colors font-medium">Mes Projets</Link>
            <Link to="/etudiant/soumissions" className="text-white/70 hover:text-white transition-colors font-medium">Mes Soumissions</Link>
            <Link to="/etudiant/cours" className="text-white/70 hover:text-white transition-colors font-medium">Mes Cours</Link>
            <Link to="/etudiant/profil" className="text-white border-b-2 border-blue-500 transition-colors font-medium">Mon Profil</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>
      
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">Mon Profil</h1>
              <p className="text-white/60">Gérez vos informations personnelles</p>
            </div>
          </div>

          {profile.primary_class && (
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-4">Classe Actuelle</h2>
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-semibold">
                  {profile.primary_class.code}
                </span>
                <span className="text-white font-medium">{profile.primary_class.title}</span>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Informations Personnelles</h2>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2 text-white/80">
                    <User className="h-4 w-4" />
                    Nom Complet
                  </Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Votre nom complet"
                    required
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-white/80">
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+242 XX XXX XXXX"
                      className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="flex items-center gap-2 text-white/80">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      value={profile.whatsapp}
                      onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                      placeholder="+242 XX XXX XXXX"
                      className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram" className="flex items-center gap-2 text-white/80">
                      <Send className="h-4 w-4" />
                      Telegram
                    </Label>
                    <Input
                      id="telegram"
                      value={profile.telegram}
                      onChange={(e) => setProfile({ ...profile, telegram: e.target.value })}
                      placeholder="@username"
                      className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github_profile" className="flex items-center gap-2 text-white/80">
                      <Github className="h-4 w-4" />
                      GitHub
                    </Label>
                    <Input
                      id="github_profile"
                      value={profile.github_profile}
                      onChange={(e) => setProfile({ ...profile, github_profile: e.target.value })}
                      placeholder="https://github.com/username"
                      className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl py-6"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les modifications
                </Button>
              </form>
            </div>
          </div>
        </div>
    </div>
  );
}