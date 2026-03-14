import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import kelyaIcon from '@/assets/kelya-icon-white.png';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if dismissed recently (don't show for 3 days)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 3 * 24 * 60 * 60 * 1000) return;

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show after 5s on iOS
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
        </div>

        {showIOSGuide ? (
          <>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">Comment installer sur iOS</h3>
              <div className="text-sm text-muted-foreground space-y-3 text-left">
                <p>1. Appuyez sur le bouton <strong>Partager</strong> (📤) en bas de Safari</p>
                <p>2. Faites défiler et appuyez sur <strong>« Sur l'écran d'accueil »</strong></p>
                <p>3. Appuyez sur <strong>« Ajouter »</strong> en haut à droite</p>
              </div>
            </div>
            <Button onClick={handleDismiss} className="w-full rounded-xl" variant="outline">
              Compris !
            </Button>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                📲 Installez Kelya Group
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Accédez plus rapidement à vos projets et soumissions. Installez l'app sur votre appareil pour une expérience optimale !
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={handleInstall} className="w-full rounded-xl gap-2" size="lg">
                <Download className="h-4 w-4" />
                Installer l'application
              </Button>
              <button
                onClick={handleDismiss}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Plus tard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
