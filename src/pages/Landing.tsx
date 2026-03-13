import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Users, Zap, Shield, BarChart3, Clock, Sparkles, BookOpen, Upload } from 'lucide-react';
import hacktualzLogo from '@/assets/hacktualiz-logo-light.jpeg';
import kelyaLogo from '@/assets/kelya-logo-white.jpg';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: "Project Submission",
      titleFr: "Soumission de Projets",
      description: "Submit your projects easily with files, links, and descriptions. Track your progress in real-time.",
      descriptionFr: "Soumettez vos projets facilement avec fichiers, liens et descriptions. Suivez votre progression en temps réel."
    },
    {
      icon: BookOpen,
      title: "Course Materials",
      titleFr: "Supports de Cours",
      description: "Access all your course materials organized by class. Download resources anytime, anywhere.",
      descriptionFr: "Accédez à tous vos supports de cours organisés par classe. Téléchargez vos ressources à tout moment."
    },
    {
      icon: Shield,
      title: "Secure Platform",
      titleFr: "Plateforme Sécurisée",
      description: "Your data is protected with enterprise-grade security. Only you and your instructors can see your work.",
      descriptionFr: "Vos données sont protégées avec une sécurité de niveau entreprise. Seuls vous et vos formateurs ont accès."
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      titleFr: "Suivi de Progression",
      description: "See your submission status, grades, and rankings. Stay on top of deadlines with smart notifications.",
      descriptionFr: "Consultez vos statuts, notes et classements. Restez informé des deadlines grâce aux notifications."
    },
    {
      icon: Clock,
      title: "Deadline Management",
      titleFr: "Gestion des Délais",
      description: "Never miss a deadline. Get notified before due dates and track all your upcoming submissions.",
      descriptionFr: "Ne ratez jamais un délai. Soyez alerté avant les dates limites et suivez toutes vos soumissions."
    },
    {
      icon: Sparkles,
      title: "Modern Experience",
      titleFr: "Expérience Moderne",
      description: "Beautiful, fast, and works perfectly on mobile. Submit from anywhere, anytime.",
      descriptionFr: "Belle, rapide et parfaitement adaptée au mobile. Soumettez depuis n'importe où."
    }
  ];

  const steps = [
    {
      icon: Users,
      title: "Create Your Account",
      titleFr: "Créez votre Compte",
      description: "Sign up with your email. Your instructor will approve your access.",
      descriptionFr: "Inscrivez-vous avec votre email. Votre formateur validera votre accès."
    },
    {
      icon: BookOpen,
      title: "Access Your Courses",
      titleFr: "Accédez à vos Cours",
      description: "Browse your classes, download materials, and view project requirements.",
      descriptionFr: "Parcourez vos classes, téléchargez les supports et consultez les consignes des projets."
    },
    {
      icon: CheckCircle,
      title: "Submit & Track",
      titleFr: "Soumettez & Suivez",
      description: "Upload your work, add links, and track feedback from your instructors.",
      descriptionFr: "Uploadez votre travail, ajoutez vos liens et suivez les retours de vos formateurs."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={hacktualzLogo} 
              alt="Hacktualiz" 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover" 
            />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">×</span>
              <img 
                src={kelyaLogo} 
                alt="Kelya Group" 
                className="h-8 w-8 rounded-lg object-cover" 
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/etudiant/login')}
              className="hover:text-primary transition-colors text-sm sm:text-base"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/etudiant/register')}
              className="bg-primary hover:bg-primary-hover text-primary-foreground transition-all shadow-xl text-sm sm:text-base px-4 sm:px-6"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 sm:pt-40 pb-16 sm:pb-32 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8 sm:space-y-12 animate-fade-in">
              <div className="space-y-6 sm:space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-primary text-sm font-medium">Powered by Hacktualiz × Kelya Group</span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                  Your Student
                  <br />
                  <span className="bg-gradient-to-r from-primary via-primary-light to-secondary-light bg-clip-text text-transparent">
                    Submission Portal
                  </span>
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl leading-relaxed font-light">
                  Plateforme centralisée pour la soumission et le suivi de vos projets étudiants. Submit your work, track your progress, succeed.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/etudiant/register')}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground transition-all px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-xl shadow-2xl hover:shadow-primary/30 hover:scale-105 group font-semibold rounded-2xl"
                >
                  Créer un compte
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/etudiant/login')}
                  className="border-2 border-border/40 hover:border-primary/60 bg-background/50 backdrop-blur-sm px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-xl hover:bg-background/80 font-semibold rounded-2xl"
                >
                  Se connecter
                </Button>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative animate-fade-in hidden lg:block" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 rounded-[3rem] blur-[120px] animate-pulse" />
              <div className="relative space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-8 bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl hover:border-primary/40 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Upload className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">Fast</div>
                        <div className="text-sm text-muted-foreground">Submissions</div>
                      </div>
                    </div>
                    <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                      <div className="h-full w-[78%] bg-gradient-to-r from-primary to-primary-light rounded-full" />
                    </div>
                  </Card>
                  
                  <Card className="p-8 bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl hover:border-secondary-light/40 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary-hover flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-7 w-7 text-secondary-foreground" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">94%</div>
                        <div className="text-sm text-muted-foreground">Success</div>
                      </div>
                    </div>
                    <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                      <div className="h-full w-[94%] bg-gradient-to-r from-secondary to-secondary-light rounded-full" />
                    </div>
                  </Card>
                </div>

                <Card className="p-8 bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Abdoulaye K.', action: 'a soumis son projet', time: '2m', color: 'from-primary to-primary-hover' },
                      { name: 'Fatima S.', action: 'a rejoint la classe', time: '15m', color: 'from-secondary to-secondary-hover' },
                      { name: 'Jean M.', action: 'projet validé ✓', time: '1h', color: 'from-success to-success-light' },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-background/40 hover:bg-background/60 transition-all group cursor-pointer">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activity.color} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                          {activity.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{activity.name}</div>
                          <div className="text-xs text-muted-foreground">{activity.action}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-32 px-4 sm:px-6 relative bg-muted/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-24 animate-fade-in">
            <div className="inline-block px-6 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-semibold mb-6">
              Features / Fonctionnalités
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8">
              Everything You Need
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Tout ce dont vous avez besoin pour gérer vos projets et réussir votre formation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, i) => (
              <Card 
                key={i}
                className="p-6 sm:p-10 bg-card/50 backdrop-blur-2xl border border-border/30 hover:border-primary/40 transition-all cursor-pointer group hover:-translate-y-2 animate-fade-in rounded-2xl sm:rounded-3xl"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xl">
                    <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold group-hover:text-primary transition-colors">
                    {feature.titleFr}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-light">
                    {feature.descriptionFr}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-24 animate-fade-in">
            <div className="inline-block px-6 py-2 bg-secondary/10 border border-secondary/20 rounded-full text-secondary-light text-sm font-semibold mb-6">
              Comment ça marche
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8">Get Started in Minutes</h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Trois étapes simples pour commencer
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-primary-light opacity-20 -translate-y-1/2" />
            
            <div className="grid sm:grid-cols-3 gap-8 sm:gap-12 relative">
              {steps.map((step, i) => (
                <Card 
                  key={i}
                  className="p-8 sm:p-12 bg-card/50 backdrop-blur-2xl border border-border/30 text-center hover:border-primary/40 transition-all group animate-scale-in hover:-translate-y-3 rounded-2xl sm:rounded-3xl relative"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl sm:text-3xl font-bold text-white shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all">
                    {i + 1}
                  </div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 sm:mb-8 mt-4 group-hover:scale-110 transition-transform">
                    <step.icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 group-hover:text-primary transition-colors">
                    {step.titleFr}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-light">
                    {step.descriptionFr}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-32 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          <Card className="relative p-10 sm:p-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 backdrop-blur-2xl border border-border/30 text-center animate-scale-in rounded-2xl sm:rounded-[3rem] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-6 sm:mb-10 bg-gradient-to-r from-primary via-primary-light to-secondary-light bg-clip-text text-transparent">
                Prêt à commencer ?
              </h2>
              <p className="text-lg sm:text-2xl text-muted-foreground mb-10 sm:mb-16 max-w-3xl mx-auto leading-relaxed font-light">
                Rejoignez la plateforme et soumettez vos projets dès maintenant
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <Button 
                  size="lg"
                  onClick={() => navigate('/etudiant/register')}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground hover:scale-105 transition-all px-10 sm:px-16 py-6 sm:py-10 text-lg sm:text-2xl shadow-2xl hover:shadow-primary/40 font-semibold rounded-2xl"
                >
                  Créer un compte
                  <ArrowRight className="ml-3 h-5 w-5 sm:h-7 sm:w-7" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 sm:py-16 px-4 sm:px-6 border-t border-border/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <img 
              src={hacktualzLogo} 
              alt="Hacktualiz" 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover" 
            />
            <span className="text-muted-foreground text-lg">×</span>
            <img 
              src={kelyaLogo} 
              alt="Kelya Group" 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover" 
            />
          </div>
          <p className="text-sm font-semibold text-foreground/80 mb-1">Hacktualiz INC × Kelya Group</p>
          <p className="text-muted-foreground text-xs sm:text-sm">© {new Date().getFullYear()} All rights reserved. Formation · Certification · Integration</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
