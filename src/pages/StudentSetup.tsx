import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function StudentSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  useEffect(() => {
    verifyMagicLink();
  }, []);

  const verifyMagicLink = async () => {
    try {
      const student_id = searchParams.get('student_id');
      const org_id = searchParams.get('org_id');

      if (!student_id || !org_id) {
        toast.error('Invalid setup link');
        navigate('/signin');
        return;
      }

      // Verify student exists and is pending
      const { data: student, error } = await supabase
        .from('submito_organization_students')
        .select('email, full_name, status')
        .eq('id', student_id)
        .eq('organization_id', org_id)
        .single();

      if (error || !student) {
        toast.error('Invalid or expired setup link');
        navigate('/signin');
        return;
      }

      if (student.status !== 'pending') {
        toast.info('Account already set up. Please sign in.');
        navigate('/student/signin');
        return;
      }

      setStudentEmail(student.email);
      setFullName(student.full_name || '');
      setStudentId(student_id);
      setOrganizationId(org_id);
    } catch (error) {
      console.error('Error verifying magic link:', error);
      toast.error('Failed to verify setup link');
      navigate('/signin');
    } finally {
      setVerifying(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      // Sign up the user with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: studentEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Update student record with user_id and status
      const { error: updateError } = await supabase
        .from('submito_organization_students')
        .update({
          user_id: authData.user.id,
          full_name: fullName.trim(),
          status: 'active',
        })
        .eq('id', studentId);

      if (updateError) throw updateError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: studentEmail,
          full_name: fullName.trim(),
        });

      if (profileError) console.error('Profile creation error:', profileError);

      toast.success('Account created successfully! You can now sign in.');
      navigate('/student/signin');
    } catch (error: any) {
      console.error('Error setting up account:', error);
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
        navigate('/student/signin');
      } else {
        toast.error(error.message || 'Failed to set up account');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <AnimatedBackground />
        <Card className="w-full max-w-md mx-4 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Verifying your invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <AnimatedBackground />
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Complete Your Setup
          </CardTitle>
          <CardDescription className="text-center">
            Set up your password to access your student account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Read-only)</Label>
              <Input
                id="email"
                type="email"
                value={studentEmail}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Setup
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <a href="/student/signin" className="text-primary hover:underline font-medium">
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
