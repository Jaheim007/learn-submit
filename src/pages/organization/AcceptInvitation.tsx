import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('invitation_token') || searchParams.get('token');

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation link');
      navigate('/organization/signin');
      return;
    }
    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('submito_organization_invitations')
        .select(`
          *,
          submito_organizations (
            name,
            logo_url
          )
        `)
        .eq('invitation_token', token)
        .is('accepted_at', null)
        .single();

      if (error || !data) {
        toast.error('Invalid or expired invitation');
        navigate('/organization/signin');
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        toast.error('This invitation has expired');
        navigate('/organization/signin');
        return;
      }

      setInvitation(data);
    } catch (error) {
      console.error('Error verifying invitation:', error);
      toast.error('Failed to verify invitation');
      navigate('/organization/signin');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Create account with email and password
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/organization/dashboard`,
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error('Failed to create account');
      }

      // Step 2: Add user to organization
      const { error: addUserError } = await supabase
        .from('submito_organization_users')
        .insert({
          organization_id: invitation.organization_id,
          user_id: signUpData.user.id,
          email: invitation.email,
          full_name: formData.fullName,
          role: invitation.role,
          is_owner: false,
        });

      if (addUserError) throw addUserError;

      // Step 3: Mark invitation as accepted
      await supabase
        .from('submito_organization_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      toast.success('Account created successfully! Welcome to the organization.');
      
      // Redirect to dashboard
      navigate('/organization/dashboard');

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
        navigate(`/organization/signin?email=${invitation.email}`);
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AnimatedBackground />
        <div className="animate-pulse text-muted-foreground relative z-10">
          Verifying invitation...
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <AnimatedBackground />
      
      <Card className="w-full max-w-md relative z-10 bg-card/90 backdrop-blur-xl border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {invitation.submito_organizations?.logo_url ? (
              <img 
                src={invitation.submito_organizations.logo_url} 
                alt="Organization Logo"
                className="h-16 w-16 object-contain"
              />
            ) : (
              <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">Join {invitation.submito_organizations?.name}</CardTitle>
          <CardDescription>
            Create your account to accept this invitation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={invitation.email}
                  disabled
                  className="pl-10 bg-muted/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? 'Creating Account...' : 'Accept Invitation & Create Account'}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate(`/organization/signin?email=${invitation.email}`)}
                className="text-primary hover:underline"
              >
                Sign in instead
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
