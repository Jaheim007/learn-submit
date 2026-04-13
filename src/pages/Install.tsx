import { Download, Smartphone, Monitor, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import hacktualizLogo from '@/assets/hacktualiz-main-logo.jpeg';

const Install = () => {
  const navigate = useNavigate();

  const handleDownloadAPK = () => {
    const link = document.createElement('a');
    link.href = '/downloads/app-debug.apk';
    link.download = 'Hacktualiz.apk';
    link.click();
  };

  const handleInstallPWA = () => {
    const event = (window as any).__pwaInstallPrompt;
    if (event) {
      event.prompt();
    } else {
      alert("Ouvrez cette page dans Chrome ou Safari, puis utilisez le menu du navigateur → 'Ajouter à l'écran d'accueil'.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Installer l'application</h1>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        {/* Logo & intro */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center p-2">
            <img src={hacktualizLogo} alt="Hacktualiz" className="h-16 w-16 object-contain rounded-xl" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Hacktualiz</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Installez l'application pour accéder rapidement à vos projets et soumissions.
          </p>
        </div>

        {/* Android APK */}
        <Card className="border-primary/30 bg-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Android</h3>
                <p className="text-xs text-muted-foreground">Téléchargez et installez l'APK</p>
              </div>
            </div>

            <Button onClick={handleDownloadAPK} className="w-full gap-2" size="lg">
              <Download className="h-4 w-4" />
              Télécharger l'APK
            </Button>

            <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground text-sm">📋 Instructions :</p>
              <p>1. Téléchargez le fichier APK</p>
              <p>2. Ouvrez le fichier téléchargé</p>
              <p>3. Autorisez l'installation depuis des sources inconnues si demandé</p>
              <p>4. Installez et ouvrez l'application</p>
            </div>
          </CardContent>
        </Card>

        {/* PWA / iOS */}
        <Card className="bg-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Monitor className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">iOS / Web</h3>
                <p className="text-xs text-muted-foreground">Installer depuis le navigateur</p>
              </div>
            </div>

            <Button onClick={handleInstallPWA} variant="outline" className="w-full gap-2" size="lg">
              <Download className="h-4 w-4" />
              Installer (PWA)
            </Button>

            <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground text-sm">📱 Sur iPhone / iPad :</p>
              <p>1. Ouvrez cette page dans <strong>Safari</strong></p>
              <p>2. Appuyez sur le bouton <strong>Partager</strong> (📤)</p>
              <p>3. Sélectionnez <strong>« Sur l'écran d'accueil »</strong></p>
              <p>4. Appuyez sur <strong>« Ajouter »</strong></p>
            </div>
          </CardContent>
        </Card>

        {/* Security note */}
        <div className="flex items-start gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <p>
            Cette application est développée par <strong className="text-foreground">NYS-Africa / Hacktualiz</strong>. 
            L'APK est signé et vérifié. Vos données sont protégées.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Install;
