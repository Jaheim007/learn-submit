import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import { useAuth } from '@/hooks/useAuth';

export default function Forbidden() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useRoles();

  const handleReturnHome = () => {
    if (user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/etudiant/mes-projets');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground mb-2">Accès restreint</CardTitle>
          <CardDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page. Cette zone est réservée aux administrateurs.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur.
          </p>
          <Button 
            onClick={handleReturnHome}
            variant="outline"
            className="w-full inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}