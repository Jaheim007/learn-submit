import { AnimatedBackground } from './AnimatedBackground';
import nysLogo from '@/assets/nys-logo.png';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="animate-pulse">
          <img 
            src={nysLogo} 
            alt="NYS Logo" 
            className="h-24 w-24 object-contain filter drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]"
          />
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          <p className="text-white/80 text-sm font-light">Chargement...</p>
        </div>
      </div>
    </div>
  );
};
