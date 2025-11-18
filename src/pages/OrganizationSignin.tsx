import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ArrowLeft } from 'lucide-react';
import { FaGoogle, FaGithub } from 'react-icons/fa';

const OrganizationSignin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleSignin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive"
      });
    }
  };

  const handleGithubSignin = async () => {
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
        description: error.message || "Failed to sign in with GitHub",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Success!",
          description: "You have signed in successfully."
        });

        navigate('/');
      }
    } catch (error: any) {
      console.error('Signin error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
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
              <p className="text-muted-foreground text-sm">
                Sign in to your organization account
              </p>
            </div>
          </div>

          {/* Social Sign In */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-border/40 hover:border-cyan-500/60 bg-background/20 backdrop-blur-sm h-12"
              onClick={handleGoogleSignin}
              disabled={loading}
            >
              <FaGoogle className="mr-2 h-5 w-5 text-cyan-400" />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-border/40 hover:border-pink-500/60 bg-background/20 backdrop-blur-sm h-12"
              onClick={handleGithubSignin}
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

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                onClick={() => {
                  toast({
                    title: "Password Reset",
                    description: "Password reset functionality coming soon"
                  });
                }}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 transition-all h-12 text-base font-semibold shadow-xl hover:shadow-pink-500/60"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Sign Up
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default OrganizationSignin;
