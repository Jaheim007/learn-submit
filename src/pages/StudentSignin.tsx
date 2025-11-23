import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function StudentSignin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      // Sign in with email and password
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      if (signInError) throw signInError;

      if (!authData.user) {
        throw new Error('Failed to sign in');
      }

      // Check if user is a student in any organization
      const { data: studentRecords, error: studentError } = await supabase
        .from('submito_organization_students')
        .select('id, organization_id, status')
        .eq('user_id', authData.user.id);

      if (studentError) throw studentError;

      if (!studentRecords || studentRecords.length === 0) {
        await supabase.auth.signOut();
        toast.error('No student account found. Please contact your organization.');
        return;
      }

      // Check student status
      const activeStudent = studentRecords.find(s => s.status === 'active');
      
      if (!activeStudent) {
        const pendingStudent = studentRecords.find(s => s.status === 'pending');
        if (pendingStudent) {
          toast.info('Your account is pending approval');
          navigate('/student/pending');
          return;
        }

        const rejectedStudent = studentRecords.find(s => s.status === 'rejected');
        if (rejectedStudent) {
          toast.error('Your account has been rejected');
          navigate('/student/rejected');
          return;
        }
      }

      toast.success('Welcome back!');
      // Navigate to student dashboard (will be created later)
      navigate('/student/dashboard');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <AnimatedBackground />
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Submito
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your student account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <div className="text-right">
              <a href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/')}
              className="text-muted-foreground"
            >
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
