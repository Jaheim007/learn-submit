import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import hacktualzLogo from '@/assets/hacktualiz-logo-light.jpeg';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <AnimatedBackground />
      
      <div className="relative z-10 text-center max-w-4xl px-6 w-full">
        <img 
          src={hacktualzLogo} 
          alt="Hacktualiz Logo" 
          className="h-24 w-24 object-cover rounded-xl mx-auto mb-8 filter drop-shadow-[0_0_30px_hsl(350,85%,50%)]"
        />
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Créez des<br />
          <span className="bg-gradient-to-r from-primary via-primary-light to-secondary-light bg-clip-text text-transparent">
            Projets Exceptionnels
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-foreground/80 mb-10 max-w-2xl mx-auto">
          Plateforme centralisée pour la soumission et le suivi de vos projets étudiants avec vos formateurs
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={() => navigate('/etudiant/register')}
            size="lg"
            className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Créer un compte
          </Button>
          
          <Button 
            onClick={() => navigate('/etudiant/login')}
            size="lg"
            variant="outline"
            className="border-2 border-foreground/20 hover:border-foreground/40 bg-background/10 backdrop-blur-sm px-8 py-6 text-lg"
          >
            Se connecter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
