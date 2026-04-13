import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { XCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import hacktualizLogo from '@/assets/hacktualiz-main-logo.jpeg';

export default function StudentRejected() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[120px] pointer-events-none" />

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
            className="h-16 w-16 rounded-[18px] object-cover mx-auto mb-5 shadow-xl shadow-destructive/10"
          />
          <h1 className="text-2xl font-bold text-foreground font-heading">Accès refusé</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Votre demande n'a pas été approuvée</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-[20px] border border-border/50 shadow-xl shadow-destructive/5 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Status icon */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-destructive">Compte désactivé</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Votre demande d'accès n'a pas été approuvée par l'administration. 
                  Contactez l'administration si vous pensez qu'il s'agit d'une erreur.
                </p>
              </div>
            </div>

            {/* Email display */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Connecté en tant que</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{user?.email}</p>
            </div>

            {/* Actions */}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full h-[48px] rounded-2xl native-btn touch-manipulation"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
