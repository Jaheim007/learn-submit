import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Upload, BookOpen, BarChart3, Shield, Clock, Users, ChevronRight } from 'lucide-react';
import kelyaLogo from '@/assets/kelya-logo-red.jpg';
import hacktualzLogo from '@/assets/hacktualiz-logo-light.jpeg';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={kelyaLogo} alt="Kelya Group" className="h-9 w-9 rounded-lg object-cover" />
            <span className="font-bold text-lg text-foreground tracking-tight">Kelya Group</span>
            <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">× Hacktualiz</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/etudiant/login')}
              className="text-muted-foreground hover:text-foreground"
            >
              Connexion
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate('/etudiant/register')}
              className="bg-secondary hover:bg-secondary-hover text-secondary-foreground rounded-lg"
            >
              S'inscrire
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(350_80%_48%_/_0.04),_transparent_50%)]" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-primary text-xs font-medium">Plateforme de soumission de projets</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
              Soumettez vos projets.
              <br />
              <span className="text-primary">Suivez votre progression.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10">
              La plateforme centralisée pour soumettre vos travaux, accéder à vos cours et suivre vos résultats en temps réel.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg"
                onClick={() => navigate('/etudiant/register')}
                className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-8 h-12 text-base font-semibold rounded-xl shadow-lg shadow-secondary/10 group"
              >
                Créer un compte gratuit
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/etudiant/login')}
                className="h-12 text-base font-medium rounded-xl border-border"
              >
                Se connecter
              </Button>
            </div>
          </div>

          {/* Hero visual - floating cards */}
          <div className="mt-16 sm:mt-20 relative">
            <div className="bg-muted/50 rounded-2xl border border-border p-6 sm:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Projets soumis', value: '1,200+', icon: Upload },
                  { label: 'Étudiants actifs', value: '340+', icon: Users },
                  { label: 'Taux de validation', value: '94%', icon: CheckCircle },
                  { label: 'Cours disponibles', value: '25+', icon: BookOpen },
                ].map((stat, i) => (
                  <div key={i} className="bg-background rounded-xl border border-border p-4 sm:p-5 text-center">
                    <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Une plateforme complète pour gérer vos projets étudiants et réussir votre formation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Upload, title: 'Soumission simple', desc: 'Uploadez vos fichiers, ajoutez des liens et une description. Tout est optionnel, rien n\'est bloquant.' },
              { icon: BookOpen, title: 'Supports de cours', desc: 'Accédez à tous vos supports de cours organisés par classe, téléchargeables à tout moment.' },
              { icon: BarChart3, title: 'Suivi en temps réel', desc: 'Consultez le statut de vos soumissions et votre progression dans le classement.' },
              { icon: Shield, title: 'Sécurisé', desc: 'Vos données sont protégées. Seuls vous et vos formateurs ont accès à votre travail.' },
              { icon: Clock, title: 'Gestion des deadlines', desc: 'Soyez alerté avant les dates limites. Ne ratez plus jamais une soumission.' },
              { icon: CheckCircle, title: 'Feedback rapide', desc: 'Recevez les retours de vos formateurs directement sur la plateforme.' },
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-background rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Comment ça marche
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Trois étapes simples pour commencer
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Créez votre compte', desc: 'Inscrivez-vous avec votre email. Votre formateur validera votre accès à la plateforme.' },
              { step: '02', title: 'Accédez à vos cours', desc: 'Parcourez vos classes, téléchargez les supports et consultez les consignes des projets.' },
              { step: '03', title: 'Soumettez & suivez', desc: 'Uploadez votre travail, ajoutez vos liens et suivez les retours de vos formateurs.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl sm:text-7xl font-black text-primary/8 absolute -top-4 left-0">{item.step}</div>
                <div className="pt-10 sm:pt-12">
                  <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <ChevronRight className="hidden sm:block absolute top-12 -right-5 h-5 w-5 text-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-secondary rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-foreground mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-secondary-foreground/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Rejoignez la plateforme et soumettez vos projets dès maintenant. C'est simple, rapide et gratuit.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/etudiant/register')}
                className="bg-primary hover:bg-primary-hover text-primary-foreground h-12 px-8 text-base font-semibold rounded-xl"
              >
                Créer un compte
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/etudiant/login')}
                className="h-12 px-8 text-base font-medium rounded-xl border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10"
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={kelyaLogo} alt="Kelya Group" className="h-8 w-8 rounded-lg object-cover" />
              <span className="text-xs text-muted-foreground">×</span>
              <img src={hacktualzLogo} alt="Hacktualiz" className="h-8 w-8 rounded-lg object-cover" />
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Kelya Group × Hacktualiz INC. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
