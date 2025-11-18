import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings as SettingsIcon, 
  User, 
  CreditCard, 
  RefreshCw, 
  BarChart3, 
  Database, 
  Archive, 
  Save,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { MembersSection } from '@/components/organization/MembersSection';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  country: string | null;
}

const settingsSections = [
  { icon: User, label: 'Profile', value: 'profile' },
  { icon: User, label: 'Members', value: 'members' },
  { icon: SettingsIcon, label: 'Settings', value: 'settings' },
  { icon: CreditCard, label: 'Payments', value: 'payments' },
];

const toolsSections = [
  { icon: RefreshCw, label: 'Sync', value: 'sync' },
  { icon: BarChart3, label: 'Analytics', value: 'analytics' },
  { icon: Database, label: 'Database', value: 'database' },
  { icon: Archive, label: 'Archive', value: 'archive' },
];

export default function OrganizationSettings() {
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    timezone: '',
    locale: '',
    language: '',
    currency: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    textAlignment: true,
    deleteItems: false,
    financialInfo: true,
    imagesWatermark: false,
    availableDownload: false,
    onboardedItem: false,
    showItemsStock: false,
    commerceProjects: true,
    accelerateDesign: true,
  });

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data: membership } = await supabase
        .from('submito_organization_users')
        .select('organization_id, email, full_name')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        navigate('/onboarding');
        return;
      }

      const { data: org } = await supabase
        .from('submito_organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .single();

      if (org) {
        setOrganization(org);
        setFormData({
          name: org.name || '',
          email: membership.email || '',
          timezone: '(+00:00) Europe/London',
          locale: 'English (United Kingdom)',
          language: 'English (US)',
          currency: 'Bitcoin',
        });
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      if (!organization) return;

      const { error } = await supabase
        .from('submito_organizations')
        .update({ 
          name: formData.name,
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast.success('Settings saved successfully');
      await loadOrganizationData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}-logo.${fileExt}`;
      const filePath = `organization-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('submito-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('submito-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('submito_organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      toast.success('Logo uploaded successfully');
      await loadOrganizationData();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-card/40 backdrop-blur-xl border-r border-border/50">
          <div className="p-6">
            <button 
              onClick={() => navigate('/organization/dashboard')}
              className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity w-full"
            >
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} className="w-10 h-10 rounded-lg" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">
                    {organization?.name?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <h1 className="text-xl font-bold text-foreground">{organization?.name || 'Submito'}</h1>
            </button>

            <nav className="space-y-8">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Customize
                </p>
                <div className="space-y-1">
                  {settingsSections.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.value;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setActiveSection(item.value)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Tools
                </p>
                <div className="space-y-1">
                  {toolsSections.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.value;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setActiveSection(item.value)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
              <p className="text-muted-foreground">Manage your organization settings and preferences</p>
            </div>

            {activeSection === 'members' && organization && (
              <MembersSection organizationId={organization.id} />
            )}

            {activeSection === 'profile' && (
              <>
                {/* Notification Settings */}
                <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Notification settings</CardTitle>
                    <CardDescription>
                      By default, designers will be notified by your company's preferred channels. 
                      Employees can also customize their preferences by logging into the intranet dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-4 text-foreground">PRIMARY SETTINGS</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Automatically text alignment</p>
                            <p className="text-sm text-muted-foreground">Here's the Onboarded statement</p>
                          </div>
                          <Switch 
                            checked={notificationSettings.textAlignment}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, textAlignment: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Automatically delete items</p>
                            <p className="text-sm text-muted-foreground">When an item is sold out</p>
                          </div>
                          <Switch 
                            checked={notificationSettings.deleteItems}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, deleteItems: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Keep my financial information</p>
                            <p className="text-sm text-muted-foreground">We will not divulge on the issue</p>
                          </div>
                          <Switch 
                            checked={notificationSettings.financialInfo}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, financialInfo: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-4 text-foreground">CHECKED ITEMS</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={notificationSettings.commerceProjects}
                            onChange={(e) => 
                              setNotificationSettings(prev => ({ ...prev, commerceProjects: e.target.checked }))
                            }
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">For commerce projects</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={notificationSettings.accelerateDesign}
                            onChange={(e) => 
                              setNotificationSettings(prev => ({ ...prev, accelerateDesign: e.target.checked }))
                            }
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">Accelerate design flow</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={notificationSettings.availableDownload}
                            onChange={(e) => 
                              setNotificationSettings(prev => ({ ...prev, availableDownload: e.target.checked }))
                            }
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">Available for download</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Details */}
                <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Edit details</CardTitle>
                    <CardDescription>
                      This Figma design system provides few styles of inputs and a variety of usage patterns.
                      Detach, mix and reuse. It's easy as a finger click
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Your name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="(+00:00) Europe/London">(+00:00) Europe/London</SelectItem>
                            <SelectItem value="(+01:00) Europe/Paris">(+01:00) Europe/Paris</SelectItem>
                            <SelectItem value="(-05:00) America/New_York">(-05:00) America/New York</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Timezone is updated automatically to match your computer timezone
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="locale">Locale</Label>
                        <Select value={formData.locale} onValueChange={(value) => setFormData(prev => ({ ...prev, locale: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English (United Kingdom)">English (United Kingdom)</SelectItem>
                            <SelectItem value="English (United States)">English (United States)</SelectItem>
                            <SelectItem value="French (France)">French (France)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English (US)">English (US)</SelectItem>
                            <SelectItem value="English (UK)">English (UK)</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="currency">Default currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Profile picture</Label>
                        <div className="mt-2 flex items-center gap-4">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={organization?.logo_url || ''} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xl">
                              {organization?.name?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-2">
                              Currently, you don't have a profile picture
                            </p>
                            <label htmlFor="logo-upload">
                              <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                                <span>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Choose file
                                </span>
                              </Button>
                              <input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoUpload}
                              />
                            </label>
                            <span className="text-sm text-muted-foreground ml-3">No file chosen to Upload</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveChanges} 
                      disabled={saving}
                      className="w-full bg-success hover:bg-success/90 text-white"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save changes
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection !== 'profile' && (
              <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} section coming soon
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
