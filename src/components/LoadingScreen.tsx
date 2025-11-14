import { AnimatedBackground } from './AnimatedBackground';
import nysLogo from '@/assets/nys-logo.png';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="animate-pulse">
          <img 
            src={nysLogo} 
            alt="NYS Logo" 
            className="h-24 w-24 object-contain filter drop-shadow-[0_0_30px_hsl(217,91%,60%)]"
          />
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          <p className="text-foreground/80 text-sm font-light">Chargement...</p>
        </div>
      </div>
    </div>
  );
};
