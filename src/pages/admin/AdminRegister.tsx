import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();
  const { isAdmin, refetch: refetchRoles } = useRoles();
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Le nom complet est requis');
      return;
    }

    setLoading(true);

    try {
      // Call the register-admin edge function
      const { data, error } = await supabase.functions.invoke('register-admin', {
        body: {
          email: email.trim(),
          password,
          full_name: fullName.trim()
        }
      });

      if (error || data?.error) {
        let errorMessage = "Une erreur s'est produite";
        
        const err = error || data?.error;
        if (typeof err === 'string') {
          if (err.includes('already registered') || err.includes('User already registered')) {
            errorMessage = "Cette adresse email est déjà utilisée";
          } else if (err.includes('Password should be at least 6 characters')) {
            errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
          } else {
            errorMessage = err;
          }
        } else if (err?.message) {
          if (err.message.includes('already registered') || err.message.includes('User already registered')) {
            errorMessage = "Cette adresse email est déjà utilisée";
          } else if (err.message.includes('Password should be at least 6 characters')) {
            errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
          } else {
            errorMessage = err.message;
          }
        }

        toast.error(errorMessage);
        return;
      }

      toast.success('Compte administrateur créé avec succès !');

      // Sign in the user after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (!signInError) {
        // Refetch roles to update the state
        await refetchRoles();
        navigate('/admin', { replace: true });
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erreur inattendue lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-destructive">Inscription fermée</CardTitle>
          <CardDescription>
            La création de comptes administrateurs est actuellement fermée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Veuillez contacter un administrateur existant pour obtenir l'accès à la plateforme.
          </p>
          
          <div className="pt-4 text-center">
            <Button
              variant="default"
              onClick={() => navigate('/admin/login')}
              className="w-full"
            >
              Retour à la connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}