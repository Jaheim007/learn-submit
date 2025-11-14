import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Phone, MessageCircle, Send, Github, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cleanClassName } from '@/lib/utils';
import { AnimatedBackground } from '@/components/AnimatedBackground';

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

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black relative overflow-hidden">
        <AnimatedBackground />
        {/* Header */}
        <section className="relative z-10 bg-gradient-to-r from-blue-950/50 to-purple-950/50 backdrop-blur-sm py-12 px-4 border-b border-white/10">
          <div className="max-w-content mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Mon Profil
                </h1>
                <p className="text-gray-300">
                  Gérez vos informations personnelles et de contact
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-content mx-auto p-4 md:p-6 lg:p-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet *</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Votre nom complet"
                        className="input-educational"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="votre@email.fr"
                        className="input-educational"
                        required
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Informations de contact
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="input-educational"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Label>
                      <Input
                        id="whatsapp"
                        value={profile.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        placeholder="+33 6 12 34 56 78 ou lien wa.me"
                        className="input-educational"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telegram" className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Telegram
                      </Label>
                      <Input
                        id="telegram"
                        value={profile.telegram}
                        onChange={(e) => handleInputChange('telegram', e.target.value)}
                        placeholder="@votre_username"
                        className="input-educational"
                      />
                    </div>
                  </div>

                  {/* Class Info */}
                  {profile.primary_class && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Groupe de classe
                      </h3>
                      
                      <div className="space-y-2">
                        <Label>Votre groupe (lecture seule)</Label>
                        <div className="px-3 py-2 bg-muted rounded-md border">
                          <span className="font-medium">{cleanClassName(profile.primary_class.title)}</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            Votre groupe est défini par l'administration. Contactez un admin en cas d'erreur.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Professional Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <Github className="w-5 h-5" />
                      Profil professionnel
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="github_profile">Profil GitHub</Label>
                      <Input
                        id="github_profile"
                        value={profile.github_profile}
                        onChange={(e) => handleInputChange('github_profile', e.target.value)}
                        placeholder="https://github.com/votre-username"
                        className="input-educational"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t border-border">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Information Note */}
            <Card className="mt-6 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">
                      Pourquoi ces informations ?
                    </p>
                    <p>
                      Ces informations aident vos formateurs à mieux vous contacter 
                      et suivre votre progression. Seuls les formateurs de vos classes 
                      peuvent voir votre profil complet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}