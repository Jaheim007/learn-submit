import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import nysLogo from '@/assets/nys-logo.png';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <AnimatedBackground />
      
      <div className="relative z-10 text-center max-w-4xl px-6 w-full">
        <img 
          src={nysLogo} 
          alt="NYS Africa Logo" 
          className="h-24 w-24 object-contain mx-auto mb-8 filter drop-shadow-[0_0_30px_hsl(217,91%,60%)]"
        />
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Créez des<br />
          <span className="text-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
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
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
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
