import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Github, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import kelyaLogo from '@/assets/kelya-logo-black.jpg';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'methods' | 'email-input';

export default function StudentLogin() {
  const [step, setStep] = useState<Step>('methods');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const routeUser = async () => {
      try {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const roleList = (roles || []).map((r) => r.role);

        if (roleList.includes('admin')) {
          navigate('/admin', { replace: true });
          return;
        }
        if (roleList.includes('academy')) {
          navigate('/academy', { replace: true });
          return;
        }
        if (roleList.includes('supervisor')) {
          navigate('/teacher', { replace: true });
          return;
        }
      } catch (err) {
        console.error('Error checking roles:', err);
      }

      const { data: student } = await supabase
        .from('students')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (token) {
            await supabase.functions.invoke('handle-oauth-signup', {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } catch (err) {
          console.error('OAuth signup handler error:', err);
        }

        navigate('/etudiant/pending', { replace: true });
        return;
      }

      if (student.status === 'rejected') {
        navigate('/etudiant/rejected', { replace: true });
      } else if (student.status === 'active') {
        navigate('/etudiant/projets', { replace: true });
      } else {
        navigate('/etudiant/pending', { replace: true });
      }
    };

    routeUser();
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/etudiant/login` },
    });

    if (error) {
      toast.error('Impossible de se connecter avec Google');
    }
  };

  const handleGithubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/etudiant/login` },
    });

    if (error) {
      toast.error('Impossible de se connecter avec GitHub');
    }
  };

  const handleSendMagicLink = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Veuillez saisir votre email');
      return;
    }

    setLoading(true);
    setLinkSent(false);

    try {
      const { data, error } = await supabase.functions.invoke('send-login-magic-link', {
        body: {
          email: normalizedEmail,
          redirect_to: `${window.location.origin}/etudiant/login`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Lien envoyé !', {
        description: `Vérifiez votre boîte mail ${normalizedEmail}`,
      });
      setLinkSent(true);
    } catch (err: any) {
      toast.error(err?.message || 'Impossible d\'envoyer le lien de connexion');
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/">
            <img
              src={kelyaLogo}
              alt="Kelya Group"
              className="h-12 w-12 rounded-xl object-cover mx-auto mb-4 hover:scale-105 transition-transform"
            />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Se connecter</h1>
          <p className="text-sm text-muted-foreground mt-1">Accédez à votre espace</p>
        </div>

        <Card className="border-border shadow-lg overflow-hidden">
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {step === 'methods' && (
                <motion.div
                  key="methods"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    className="w-full h-12 text-sm font-medium justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuer avec Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGithubSignIn}
                    className="w-full h-12 text-sm font-medium justify-center gap-3"
                  >
                    <Github className="w-5 h-5" />
                    Continuer avec GitHub
                  </Button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep('email-input')}
                    className="w-full h-12 text-sm font-medium bg-secondary hover:bg-secondary-hover text-secondary-foreground justify-center gap-3"
                  >
                    <Mail className="w-5 h-5" />
                    Se connecter par email
                  </Button>
                </motion.div>
              )}

              {step === 'email-input' && (
                <motion.div
                  key="email"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => setStep('methods')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>

                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">Entrez votre email</h2>
                    <p className="text-sm text-muted-foreground">Nous vous enverrons un lien de connexion</p>
                  </div>

                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMagicLink()}
                    autoFocus
                  />

                  <Button
                    onClick={handleSendMagicLink}
                    disabled={loading || !email.trim()}
                    className="w-full h-12 bg-secondary hover:bg-secondary-hover text-secondary-foreground font-medium"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Recevoir le lien de connexion
                  </Button>

                  {linkSent && (
                    <p className="text-sm text-center text-muted-foreground">
                      Le lien est envoyé. Ouvrez votre email pour continuer.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          En continuant, vous acceptez nos conditions d'utilisation.
        </p>
      </div>
    </div>
  );
}
