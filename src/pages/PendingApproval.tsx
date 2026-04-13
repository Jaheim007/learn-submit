import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import hacktualizLogo from '@/assets/hacktualiz-main-logo.jpeg';

export default function PendingApproval() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  // If not logged in, redirect to login
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  const checkStatus = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roleList = (roles || []).map(r => r.role);

      if (roleList.includes('admin')) {
        toast.success('🎉 Accès autorisé !');
        navigate('/admin', { replace: true }); return;
      }
      if (roleList.includes('academy')) {
        toast.success('🎉 Accès autorisé !');
        navigate('/academy', { replace: true }); return;
      }
      if (roleList.includes('supervisor')) {
        toast.success('🎉 Accès autorisé !');
        navigate('/teacher', { replace: true }); return;
      }
      if (roleList.includes('student')) {
        const { data: student } = await supabase
          .from('students')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (student?.status === 'active') {
          toast.success('🎉 Votre compte est prêt !');
          navigate('/etudiant/projets', { replace: true }); return;
        }
        if (student?.status === 'rejected') {
          navigate('/etudiant/rejected', { replace: true }); return;
        }
      }

      // Still no role assigned
      toast.info('⏳ Votre compte est toujours en attente de validation par l\'administration.');
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Erreur lors de la vérification');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
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
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.img
            src={hacktualizLogo}
            alt="Hacktualiz"
            className="h-16 w-16 rounded-[18px] object-cover mx-auto mb-5 shadow-xl shadow-primary/10"
          />
          <h1 className="text-2xl font-bold text-foreground font-heading">Compte en attente</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Votre inscription a été reçue</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-[20px] border border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Status icon */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--warning))]/10 flex items-center justify-center">
                <Clock className="h-8 w-8 text-[hsl(var(--warning))] animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-foreground">En cours de vérification</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  L'administration doit approuver votre compte et vous assigner un rôle.
                  Vous recevrez une notification une fois activé.
                </p>
              </div>
            </div>

            {/* Email display */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Connecté en tant que
              </p>
              <p className="text-sm font-medium text-foreground mt-0.5">{user?.email}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={checkStatus}
                disabled={checking}
                className="w-full h-[48px] rounded-2xl font-semibold native-btn touch-manipulation"
              >
                {checking ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Vérification...</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" />Vérifier le statut</>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full h-[44px] rounded-2xl native-btn touch-manipulation"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </Button>
            </div>

            <p className="text-[11px] text-center text-muted-foreground">
              Ce processus prend généralement 24-48 heures.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
