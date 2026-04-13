import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Github, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import hacktualizLogo from '@/assets/hacktualiz-main-logo.jpeg';
import { motion, AnimatePresence } from 'framer-motion';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type Step = 'methods' | 'email-input' | 'otp-input';

export default function StudentLogin() {
  const [step, setStep] = useState<Step>('methods');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const routeUser = async () => {
      try {
        // Check if user has any role assigned
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
        const roleList = (roles || []).map((r) => r.role);
        
        // Route based on assigned role
        if (roleList.includes('admin')) { navigate('/admin', { replace: true }); return; }
        if (roleList.includes('academy')) { navigate('/academy', { replace: true }); return; }
        if (roleList.includes('supervisor')) { navigate('/teacher', { replace: true }); return; }
        
        // If student role, check student record status
        if (roleList.includes('student')) {
          const { data: student } = await supabase.from('students').select('id, status').eq('user_id', user.id).maybeSingle();
          if (student?.status === 'rejected') { navigate('/etudiant/rejected', { replace: true }); return; }
          if (student?.status === 'active') { navigate('/etudiant/projets', { replace: true }); return; }
          navigate('/pending', { replace: true }); return;
        }
        
        // No role at all — ensure profile exists then go to pending
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (token) { await supabase.functions.invoke('handle-oauth-signup', { headers: { Authorization: `Bearer ${token}` } }); }
        } catch (err) { console.error('OAuth signup handler error:', err); }
        navigate('/pending', { replace: true });
      } catch (err) { 
        console.error('Error checking roles:', err);
        navigate('/pending', { replace: true });
      }
    };
    routeUser();
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/login` } });
    if (error) toast.error('Impossible de se connecter avec Google');
  };

  const handleGithubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/login` } });
    if (error) toast.error('Impossible de se connecter avec GitHub');
  };

  const handleSendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { toast.error('Veuillez saisir votre email'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-login-magic-link', { body: { email: normalizedEmail } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Code envoyé !', { description: `Vérifiez votre boîte mail ${normalizedEmail}` });
      setStep('otp-input');
    } catch (err: any) {
      toast.error(err?.message || "Impossible d'envoyer le code de connexion");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 8) { toast.error('Veuillez saisir le code à 8 chiffres'); return; }
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: otpCode, type: 'email' });
      if (error) throw error;
      toast.success('Connexion réussie !');
    } catch (err: any) {
      toast.error(err?.message || 'Code invalide ou expiré');
    } finally { setVerifying(false); }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 30, scale: 0.98 },
    center: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -30, scale: 0.98 },
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo + header */}
        <div className="text-center mb-8">
          <Link to="/">
            <motion.img
              src={hacktualizLogo}
              alt="Hacktualiz"
              className="h-16 w-16 rounded-[18px] object-cover mx-auto mb-5 shadow-xl shadow-primary/10"
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            />
          </Link>
          <h1 className="text-2xl font-bold text-foreground font-heading">Se connecter</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Accédez à votre espace</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-[20px] border border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 'methods' && (
                <motion.div
                  key="methods"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="space-y-3"
                >
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full h-[52px] rounded-2xl border border-border/60 bg-card hover:bg-muted/40 flex items-center justify-center gap-3 text-sm font-medium text-foreground transition-all native-btn touch-manipulation"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuer avec Google
                  </button>

                  <button
                    type="button"
                    onClick={handleGithubSignIn}
                    className="w-full h-[52px] rounded-2xl border border-border/60 bg-card hover:bg-muted/40 flex items-center justify-center gap-3 text-sm font-medium text-foreground transition-all native-btn touch-manipulation"
                  >
                    <Github className="w-5 h-5" />
                    Continuer avec GitHub
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-4 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('email-input')}
                    className="w-full h-[52px] rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-3 text-sm font-semibold transition-all native-btn touch-manipulation shadow-lg shadow-primary/20"
                  >
                    <Mail className="w-5 h-5" />
                    Se connecter par email
                  </button>
                </motion.div>
              )}

              {step === 'email-input' && (
                <motion.div
                  key="email"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="space-y-5"
                >
                  <button
                    onClick={() => setStep('methods')}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors native-btn"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>

                  <div className="text-center space-y-1">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground font-heading">Entrez votre email</h2>
                    <p className="text-sm text-muted-foreground">Nous vous enverrons un code de connexion</p>
                  </div>

                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-[52px] rounded-2xl text-base px-4"
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    autoFocus
                  />

                  <Button
                    onClick={handleSendOtp}
                    disabled={loading || !email.trim()}
                    className="w-full h-[52px] rounded-2xl font-semibold text-base shadow-lg shadow-primary/20 native-btn"
                  >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Recevoir le code
                  </Button>
                </motion.div>
              )}

              {step === 'otp-input' && (
                <motion.div
                  key="otp"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="space-y-5"
                >
                  <button
                    onClick={() => { setStep('email-input'); setOtpCode(''); }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors native-btn"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>

                  <div className="text-center space-y-1">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
                      <Mail className="h-5 w-5 text-success" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground font-heading">Entrez le code</h2>
                    <p className="text-sm text-muted-foreground">
                      Code envoyé à <span className="font-semibold text-foreground">{email}</span>
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP maxLength={8} value={otpCode} onChange={(value) => setOtpCode(value)}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                        <InputOTPSlot index={6} />
                        <InputOTPSlot index={7} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    disabled={verifying || otpCode.length !== 8}
                    className="w-full h-[52px] rounded-2xl font-semibold text-base shadow-lg shadow-primary/20 native-btn"
                  >
                    {verifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Se connecter
                  </Button>

                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center native-btn py-2"
                  >
                    {loading ? 'Envoi en cours...' : 'Renvoyer le code'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          En continuant, vous acceptez nos conditions d'utilisation.
        </p>
      </motion.div>
    </div>
  );
}
