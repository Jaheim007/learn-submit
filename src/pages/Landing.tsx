import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Upload, BookOpen, BarChart3, Shield, Clock, Users, ChevronRight, LogIn, UserPlus, Zap, Award, MessageSquare, Globe, ChevronLeft, FileText, TrendingUp, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import kelyaLogo from '@/assets/kelya-logo-red.jpg';
import hacktualzLogo from '@/assets/hacktualiz-logo-light.jpeg';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      >
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
              onClick={() => navigate('/etudiant/register')}
              className="text-muted-foreground hover:text-foreground"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              S'inscrire
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate('/etudiant/login')}
              className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg"
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              Connexion
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(350_80%_48%_/_0.05),_transparent_50%)]" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 relative">
          <div className="max-w-3xl">
            <motion.div 
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-xs font-medium">Plateforme de soumission de projets</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6"
            >
              Soumettez vos projets.
              <br />
              <span className="text-primary">Suivez votre progression.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10"
            >
              La plateforme centralisée pour soumettre vos travaux, accéder à vos cours et suivre vos résultats en temps réel.
            </motion.p>
            
            <motion.div 
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button 
                size="lg"
                onClick={() => navigate('/etudiant/login')}
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 group"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Se connecter
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/etudiant/register')}
                className="h-12 text-base font-medium rounded-xl border-border hover:bg-muted"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Créer un compte
              </Button>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <motion.div 
            variants={stagger} initial="hidden" animate="visible"
            className="mt-16 sm:mt-20"
          >
            <div className="bg-muted/50 rounded-2xl border border-border p-6 sm:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Projets soumis', value: '1,200+', icon: Upload },
                  { label: 'Étudiants actifs', value: '340+', icon: Users },
                  { label: 'Taux de validation', value: '94%', icon: CheckCircle },
                  { label: 'Cours disponibles', value: '25+', icon: BookOpen },
                ].map((stat, i) => (
                  <motion.div 
                    key={i} 
                    variants={scaleIn} custom={i + 4}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className="bg-background rounded-xl border border-border p-4 sm:p-5 text-center cursor-default transition-shadow hover:shadow-lg"
                  >
                    <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="py-10 px-4 sm:px-6 border-y border-border bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Propulsé par</span>
            <div className="flex items-center gap-8">
              <motion.img 
                whileHover={{ scale: 1.05 }}
                src={kelyaLogo} alt="Kelya Group" className="h-10 w-10 rounded-lg object-cover" 
              />
              <span className="text-muted-foreground text-lg">×</span>
              <motion.img 
                whileHover={{ scale: 1.05 }}
                src={hacktualzLogo} alt="Hacktualiz" className="h-10 w-10 rounded-lg object-cover" 
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Une plateforme complète pour gérer vos projets étudiants et réussir votre formation.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Upload, title: 'Soumission simple', desc: 'Uploadez vos fichiers, ajoutez des liens et une description. Tout est optionnel, rien n\'est bloquant.' },
              { icon: BookOpen, title: 'Supports de cours', desc: 'Accédez à tous vos supports de cours organisés par classe, téléchargeables à tout moment.' },
              { icon: BarChart3, title: 'Suivi en temps réel', desc: 'Consultez le statut de vos soumissions et votre progression dans le classement.' },
              { icon: Shield, title: 'Sécurisé', desc: 'Vos données sont protégées. Seuls vous et vos formateurs ont accès à votre travail.' },
              { icon: Clock, title: 'Gestion des deadlines', desc: 'Soyez alerté avant les dates limites. Ne ratez plus jamais une soumission.' },
              { icon: CheckCircle, title: 'Feedback rapide', desc: 'Recevez les retours de vos formateurs directement sur la plateforme.' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4, boxShadow: '0 12px 40px -12px hsl(350 80% 48% / 0.1)' }}
                className="bg-background rounded-xl border border-border p-6 transition-all group cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - with timeline */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Comment ça marche
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Trois étapes simples pour commencer
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
            
            {[
              { step: '01', title: 'Connectez-vous', desc: 'Accédez à votre compte avec vos identifiants. Nouveau ? Créez votre compte en 30 secondes.', icon: LogIn },
              { step: '02', title: 'Accédez à vos cours', desc: 'Parcourez vos classes, téléchargez les supports et consultez les consignes des projets.', icon: BookOpen },
              { step: '03', title: 'Soumettez & suivez', desc: 'Uploadez votre travail, ajoutez vos liens et suivez les retours de vos formateurs.', icon: Upload },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative text-center"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 relative z-10"
                >
                  <item.icon className="h-6 w-6 text-primary" />
                </motion.div>
                <div className="text-xs font-bold text-primary mb-2 tracking-widest">ÉTAPE {item.step}</div>
                <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Extra Benefits */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                Pourquoi choisir notre plateforme ?
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Zap, title: 'Rapide & intuitif', desc: 'Interface conçue pour les étudiants. Soumettez en moins de 2 minutes.' },
                  { icon: Award, title: 'Classement & motivation', desc: 'Suivez votre rang parmi vos camarades et restez motivé tout au long de la formation.' },
                  { icon: MessageSquare, title: 'Communication directe', desc: 'Recevez des notifications et retours en temps réel de vos formateurs.' },
                  { icon: Globe, title: 'Accessible partout', desc: 'Plateforme responsive, utilisable sur mobile, tablette et ordinateur.' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-secondary rounded-2xl p-8 text-secondary-foreground relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-sm text-secondary-foreground/60">Taux de réussite</div>
                      <div className="text-2xl font-bold">94%</div>
                    </div>
                  </div>
                  <div className="h-px bg-secondary-foreground/10" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary-foreground/5 rounded-xl p-4">
                      <div className="text-2xl font-bold">340+</div>
                      <div className="text-xs text-secondary-foreground/60 mt-1">Étudiants inscrits</div>
                    </div>
                    <div className="bg-secondary-foreground/5 rounded-xl p-4">
                      <div className="text-2xl font-bold">1.2K</div>
                      <div className="text-xs text-secondary-foreground/60 mt-1">Projets soumis</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[85, 72, 90, 65, 95, 80, 88].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h * 0.6}px` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                        className="flex-1 bg-primary/30 rounded-t-sm"
                        style={{ maxHeight: `${h * 0.6}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-secondary rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-foreground mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-secondary-foreground/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
                Connectez-vous à votre espace ou créez votre compte pour soumettre vos projets dès maintenant.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  size="lg"
                  onClick={() => navigate('/etudiant/login')}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground h-12 px-8 text-base font-semibold rounded-xl"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg"
                  onClick={() => navigate('/etudiant/register')}
                  className="h-12 px-8 text-base font-medium rounded-xl bg-white text-secondary hover:bg-white/90 border-0"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Créer un compte
                </Button>
              </div>
            </div>
          </motion.div>
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
