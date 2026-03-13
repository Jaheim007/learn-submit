import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import kelyaLogo from '@/assets/kelya-logo-red.jpg';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="text-center max-w-lg">
        <img src={kelyaLogo} alt="Kelya Group" className="h-16 w-16 object-cover rounded-xl mx-auto mb-6" />
        
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Plateforme de Soumission
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Soumettez vos projets étudiants et suivez votre progression avec vos formateurs.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate('/etudiant/register')} className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-6 h-11">
            Créer un compte
          </Button>
          <Button onClick={() => navigate('/etudiant/login')} variant="outline" className="h-11">
            Se connecter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
