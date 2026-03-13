import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Upload, BookOpen, BarChart3, Shield, Clock, Users, ChevronRight, LogIn, UserPlus, Zap, Award, MessageSquare, Globe, ChevronLeft, FileText, TrendingUp, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
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

const slides = [
  {
    icon: Upload,
    title: 'Soumettez vos projets',
    desc: 'Uploadez fichiers, liens GitHub et descriptions en quelques clics. Tous les champs sont optionnels.',
    color: 'bg-primary/10',
    iconColor: 'text-primary',
    visual: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-background/80 rounded-lg p-3 border border-border">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1"><div className="h-2.5 bg-primary/20 rounded w-3/4" /><div className="h-2 bg-muted rounded w-1/2 mt-1.5" /></div>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
        <div className="flex items-center gap-3 bg-background/80 rounded-lg p-3 border border-border">
          <Globe className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1"><div className="h-2.5 bg-primary/20 rounded w-2/3" /><div className="h-2 bg-muted rounded w-1/3 mt-1.5" /></div>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
        <div className="flex items-center gap-3 bg-background/80 rounded-lg p-3 border border-border opacity-50">
          <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1"><div className="h-2.5 bg-muted rounded w-1/2" /></div>
          <div className="h-4 w-4 rounded-full border-2 border-muted" />
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: 'Suivez votre progression',
    desc: 'Tableau de bord avec statuts en temps réel, classement et historique de vos soumissions.',
    color: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    visual: (
      <div className="space-y-3">
        <div className="flex gap-2 items-end h-20">
          {[40, 60, 35, 80, 55, 90, 70].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/40 to-primary/20" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ l: 'Validés', v: '12' }, { l: 'En attente', v: '3' }, { l: 'Classement', v: '#4' }].map((s, i) => (
            <div key={i} className="bg-background/80 rounded-lg p-2 text-center border border-border">
              <div className="text-sm font-bold text-foreground">{s.v}</div>
              <div className="text-[10px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Bell,
    title: 'Notifications & Deadlines',
    desc: 'Soyez alerté pour chaque retour de formateur et chaque échéance de projet approchante.',
    color: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    visual: (
      <div className="space-y-2.5">
        {[
          { t: 'Projet validé ✓', d: 'Votre soumission HTML/CSS a été validée', time: '2min', dot: 'bg-green-500' },
          { t: 'Deadline demain', d: 'Projet React — il reste 18h', time: '1h', dot: 'bg-amber-500' },
          { t: 'Nouveau feedback', d: 'M. Diallo a commenté votre travail', time: '3h', dot: 'bg-blue-500' },
        ].map((n, i) => (
          <div key={i} className="flex items-start gap-3 bg-background/80 rounded-lg p-3 border border-border">
            <div className={`w-2 h-2 rounded-full ${n.dot} mt-1.5 shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground">{n.t}</div>
              <div className="text-[10px] text-muted-foreground truncate">{n.d}</div>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: TrendingUp,
    title: 'Classement en direct',
    desc: 'Comparez votre progression avec vos camarades et visez le top du leaderboard.',
    color: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    visual: (
      <div className="space-y-2">
        {[
          { rank: '1', name: 'Aminata K.', pts: '980', bar: 'w-full' },
          { rank: '2', name: 'Jean-Paul M.', pts: '920', bar: 'w-[94%]' },
          { rank: '3', name: 'Fatou D.', pts: '870', bar: 'w-[89%]' },
          { rank: '4', name: 'Vous', pts: '845', bar: 'w-[86%]', highlight: true },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-lg p-2.5 ${s.highlight ? 'bg-primary/10 border border-primary/20' : 'bg-background/80 border border-border'}`}>
            <span className={`text-xs font-bold w-5 text-center ${s.highlight ? 'text-primary' : 'text-muted-foreground'}`}>#{s.rank}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-medium ${s.highlight ? 'text-primary' : 'text-foreground'}`}>{s.name}</span>
                <span className="text-[10px] text-muted-foreground">{s.pts} pts</span>
              </div>
              <div className="h-1 bg-muted rounded-full"><div className={`h-full ${s.highlight ? 'bg-primary' : 'bg-primary/30'} rounded-full ${s.bar}`} /></div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

const PlatformSlider = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  const slide = slides[current];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/20 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Découvrez la plateforme
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Un aperçu de ce qui vous attend une fois connecté
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center min-h-[320px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`text-${current}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <div className={`w-12 h-12 rounded-xl ${slide.color} flex items-center justify-center mb-5`}>
                  <slide.icon className={`h-6 w-6 ${slide.iconColor}`} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">{slide.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{slide.desc}</p>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`visual-${current}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeInOut', delay: 0.05 }}
                className="bg-muted/50 rounded-2xl border border-border p-6"
              >
                {slide.visual}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => goTo((current - 1 + slides.length) % slides.length)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/30'}`}
                />
              ))}
            </div>
            <button
              onClick={() => goTo((current + 1) % slides.length)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
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

      {/* Platform Showcase Slider */}
      <PlatformSlider />

      {/* What our platform does */}
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
                Ce que fait notre plateforme
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
