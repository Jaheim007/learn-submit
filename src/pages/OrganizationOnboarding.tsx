import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ArrowRight, ArrowLeft, Upload, Building2, Globe, Users, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OrganizationOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '',
    industry: '',
    description: '',
    staffSize: '',
    website: '',
    country: '',
    logoFile: null as File | null,
    bannerFile: null as File | null
  });

  const totalSteps = 4;

  const industries = [
    'Education & Training',
    'Technology & IT',
    'Healthcare',
    'Finance & Banking',
    'Manufacturing',
    'Retail & E-commerce',
    'Consulting',
    'Marketing & Advertising',
    'Real Estate',
    'Hospitality & Tourism',
    'Other'
  ];

  const staffSizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'France',
    'Germany',
    'Australia',
    'Japan',
    'China',
    'India',
    'Brazil',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoFile' | 'bannerFile') => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload logo if provided
      let logoUrl = null;
      if (formData.logoFile) {
        const logoPath = `${user.id}/${Date.now()}_${formData.logoFile.name}`;
        logoUrl = await uploadFile(formData.logoFile, 'avatars', logoPath);
      }

      // Upload banner if provided
      let bannerUrl = null;
      if (formData.bannerFile) {
        const bannerPath = `${user.id}/${Date.now()}_${formData.bannerFile.name}`;
        bannerUrl = await uploadFile(formData.bannerFile, 'avatars', bannerPath);
      }

      // Create organization slug from name
      const slug = formData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Create the organization
      const { data: org, error: orgError } = await supabase
        .from('submito_organizations')
        .insert({
          name: formData.organizationName,
          slug: slug,
          industry: formData.industry,
          description: formData.description,
          staff_size: formData.staffSize,
          website: formData.website,
          country: formData.country,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          onboarding_completed: true,
          is_active: true
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as organization owner
      const { error: userError } = await supabase
        .from('submito_organization_users')
        .insert({
          user_id: user.id,
          organization_id: org.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'owner',
          is_owner: true
        });

      if (userError) throw userError;

      toast({
        title: "Success!",
        description: "Your organization has been set up successfully."
      });

      // Redirect to organization dashboard
      navigate('/organization/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.organizationName.trim().length > 0;
      case 2:
        return formData.industry.length > 0;
      case 3:
        return formData.staffSize.length > 0;
      case 4:
        return true; // Optional step
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Building2 className="mx-auto h-12 w-12 text-cyan-400 mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Let's start with the basics</h2>
              <p className="text-muted-foreground mt-2">What's the name of your organization?</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="e.g., Acme Inc."
                className="text-lg h-12"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Globe className="mx-auto h-12 w-12 text-pink-400 mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Tell us about your organization</h2>
              <p className="text-muted-foreground mt-2">What industry are you in?</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={formData.industry} onValueChange={(value) => handleSelectChange('industry', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => handleSelectChange('country', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What does your organization do?"
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="mx-auto h-12 w-12 text-purple-400 mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Organization size</h2>
              <p className="text-muted-foreground mt-2">How many people work at your organization?</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staffSize">Staff Size *</Label>
                <Select value={formData.staffSize} onValueChange={(value) => handleSelectChange('staffSize', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select staff size" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="h-12"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <FileText className="mx-auto h-12 w-12 text-cyan-400 mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Branding (optional)</h2>
              <p className="text-muted-foreground mt-2">Add your logo and banner to personalize your workspace</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="logo">Organization Logo</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo')?.click()}
                    className="w-full h-12"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.logoFile ? formData.logoFile.name : 'Upload Logo'}
                  </Button>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logoFile')}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Recommended: Square image, at least 200x200px</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner">Organization Banner</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('banner')?.click()}
                    className="w-full h-12"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.bannerFile ? formData.bannerFile.name : 'Upload Banner'}
                  </Button>
                  <input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'bannerFile')}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Recommended: 1200x300px or wider</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12">
      <AnimatedBackground />

      <Card className="relative w-full max-w-2xl p-10 bg-card/40 backdrop-blur-2xl border-2 border-border/30 shadow-2xl rounded-3xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1"
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex-1 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90"
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90"
              disabled={loading || !canProceed()}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          )}
        </div>

        {/* Skip option for optional steps */}
        {currentStep === 4 && (
          <div className="text-center mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSubmit}
              className="text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              Skip for now
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrganizationOnboarding;
