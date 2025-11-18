import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ArrowLeft } from 'lucide-react';
import submitoLogo from '@/assets/submito-logo.png';
import { FaGoogle, FaGithub } from 'react-icons/fa';

const OrganizationSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationName: '',
    termsAccepted: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-redirect`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up with Google",
        variant: "destructive"
      });
    }
  };

  const handleGithubSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/onboarding`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up with GitHub",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms of service and privacy policy",
        variant: "destructive"
      });
      return;
    }

    if (!formData.organizationName.trim()) {
      toast({
        title: "Organization Required",
        description: "Please enter your organization name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            organization_name: formData.organizationName
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create organization
        const orgSlug = formData.organizationName.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const { data: orgData, error: orgError } = await supabase
          .from('submito_organizations')
          .insert({
            name: formData.organizationName,
            slug: orgSlug,
            subdomain: orgSlug
          })
          .select()
          .single();

        if (orgError) throw orgError;

        // Add user as organization owner
        const { error: ownerError } = await supabase
          .from('submito_organization_users')
          .insert({
            organization_id: orgData.id,
            user_id: authData.user.id,
            email: formData.email,
            full_name: `${formData.firstName} ${formData.lastName}`,
            role: 'owner',
            is_owner: true
          });

        if (ownerError) throw ownerError;

        toast({
          title: "Success!",
          description: "Your organization has been created. Please check your email to verify your account."
        });

        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12">
      <AnimatedBackground />
      
      {/* Back to Home Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 text-foreground/80 hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <Card className="relative w-full max-w-md p-10 bg-card/40 backdrop-blur-2xl border-2 border-border/30 shadow-2xl rounded-3xl">
        <div className="space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Submito
              </h1>
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">
                Welcome!
              </p>
              <p className="text-muted-foreground text-sm">
                Create your organization to manage your institution
              </p>
            </div>
          </div>

          {/* Social Sign Up */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-border/40 hover:border-cyan-500/60 bg-background/20 backdrop-blur-sm h-12"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <FaGoogle className="mr-2 h-5 w-5 text-cyan-400" />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-border/40 hover:border-pink-500/60 bg-background/20 backdrop-blur-sm h-12"
              onClick={handleGithubSignup}
              disabled={loading}
            >
              <FaGithub className="mr-2 h-5 w-5 text-pink-400" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="bg-background/30 border-border/40 focus:border-cyan-500/60 h-11"
                  placeholder="Emily"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="bg-background/30 border-border/40 focus:border-cyan-500/60 h-11"
                  placeholder="Johnson"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-sm font-medium">Organization Name</Label>
              <Input
                id="organizationName"
                name="organizationName"
                type="text"
                required
                value={formData.organizationName}
                onChange={handleChange}
                className="bg-background/30 border-border/40 focus:border-cyan-500/60 h-11"
                placeholder="Acme University"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="bg-background/30 border-border/40 focus:border-cyan-500/60 h-11"
                placeholder="emily@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="bg-background/30 border-border/40 focus:border-cyan-500/60 h-11"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, termsAccepted: checked as boolean }))
                }
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 transition-all h-12 text-base font-semibold shadow-xl hover:shadow-pink-500/60"
            >
              {loading ? 'Creating Organization...' : 'Sign Up'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/organization/signin')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default OrganizationSignup;
