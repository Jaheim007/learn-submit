import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Users, Zap, Shield, BarChart3, Clock, Sparkles } from 'lucide-react';
import submitoLogo from '@/assets/submito-logo.png';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Multi-Tenant Architecture",
      description: "Create your organization and manage students, teachers, and courses independently."
    },
    {
      icon: Zap,
      title: "Real-Time Collaboration",
      description: "Instant feedback, live chat, and seamless communication between teachers and students."
    },
    {
      icon: Shield,
      title: "Secure & Scalable",
      description: "Enterprise-grade security with row-level isolation and automated backups."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track student progress, submission rates, and performance metrics in real-time."
    },
    {
      icon: Clock,
      title: "Automated Workflows",
      description: "Smart deadlines, automatic notifications, and streamlined approval processes."
    },
    {
      icon: Sparkles,
      title: "Modern Interface",
      description: "Beautiful, intuitive design that works seamlessly across all devices."
    }
  ];

  const steps = [
    {
      icon: Users,
      title: "Sign Up & Set Up",
      description: "Create your organization in minutes. Add your team members and configure your workspace."
    },
    {
      icon: BarChart3,
      title: "Create Courses & Projects",
      description: "Design courses, assign projects, and set deadlines. Everything organized in one place."
    },
    {
      icon: CheckCircle,
      title: "Track & Evaluate",
      description: "Monitor submissions, provide feedback, and watch your students succeed."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={submitoLogo} 
              alt="Submito" 
              className="h-12 w-12 animate-float" 
              style={{ 
                filter: 'drop-shadow(0 0 30px hsl(var(--submito-cyan) / 0.6))' 
              }} 
            />
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Submito
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/organization/signin')}
              className="hover:text-cyan-400 transition-colors text-base"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 transition-all shadow-xl hover:shadow-pink-500/50 text-base px-6"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 animate-fade-in">
              <div className="space-y-6">
                <h1 className="text-6xl md:text-8xl font-bold leading-[1.1] tracking-tight">
                  Streamline Your
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-scale-in inline-block">
                    Educational Workflow
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed">
                  The ultimate platform for managing student submissions, courses, and academic progress. Built for modern educational institutions.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5 pt-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 transition-all px-10 py-7 text-lg shadow-2xl hover:shadow-cyan-500/60 hover:scale-105 group font-semibold"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/demo')}
                  className="border-2 border-cyan-500/30 hover:border-cyan-500/60 bg-background/5 backdrop-blur-sm px-10 py-7 text-lg hover:bg-background/20 font-semibold"
                >
                  See Demo
                </Button>
              </div>
              
              {/* Social Proof */}
              <div className="flex items-center gap-10 pt-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 via-pink-500 to-purple-500 border-4 border-background shadow-lg" 
                    />
                  ))}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">500+ educators</p>
                  <p className="text-sm text-muted-foreground">trust Submito worldwide</p>
                </div>
              </div>
            </div>

            {/* Hero Card */}
            <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-pink-500 to-purple-500 rounded-[2rem] blur-[100px] opacity-30 animate-pulse" />
              <Card className="relative p-10 bg-card/40 backdrop-blur-2xl border-2 border-border/30 shadow-2xl rounded-3xl hover:border-border/50 transition-all">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold">Upcoming Tasks</h3>
                    <Button size="sm" variant="outline" className="text-sm border-border/40 hover:border-cyan-500/60">
                      Download Report
                    </Button>
                  </div>
                  {[
                    { time: '08:00 am', title: 'Company Pitch Deck', color: 'from-blue-500 to-cyan-500' },
                    { time: '09:00 am', title: 'Meetings', color: 'from-purple-500 to-pink-500' },
                    { time: '10:00 am', title: 'UI Kit', color: 'from-green-500 to-emerald-500' },
                    { time: '11:00 am', title: 'Design System', color: 'from-orange-500 to-red-500' }
                  ].map((task, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-4 p-4 rounded-xl bg-background/40 hover:bg-background/70 transition-all cursor-pointer group animate-slide-in-right border border-border/20 hover:border-border/40"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <span className="text-base text-muted-foreground w-24 font-medium">{task.time}</span>
                      <div className={`h-10 flex-1 rounded-lg bg-gradient-to-r ${task.color} flex items-center justify-center text-sm font-semibold text-white group-hover:scale-[1.02] transition-transform shadow-lg`}>
                        {task.title}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Maximize Productivity and Efficiency
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Everything you need to manage your educational institution, all in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card 
                key={i}
                className="p-8 bg-card/30 backdrop-blur-2xl border-2 border-border/30 hover:border-cyan-500/50 transition-all cursor-pointer group hover:scale-105 animate-fade-in rounded-2xl"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-pink-500 to-purple-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xl">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">How It Works</h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get started in three simple steps and transform your educational workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <Card 
                key={i}
                className="p-10 bg-card/30 backdrop-blur-2xl border-2 border-border/30 text-center hover:border-cyan-500/50 transition-all group animate-scale-in hover:scale-105 rounded-2xl"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="relative">
                  <div className="absolute -top-6 -right-6 text-8xl font-bold text-cyan-500/10">
                    {i + 1}
                  </div>
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500 via-pink-500 to-purple-500 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xl relative z-10">
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-cyan-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <Card className="p-16 bg-gradient-to-br from-cyan-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-2xl border-2 border-border/30 text-center animate-scale-in rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-pink-500/5 to-purple-500/5 animate-pulse" />
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Ready to Get Started?
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Join hundreds of educational institutions already using Submito to streamline their workflow
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 hover:scale-105 transition-all px-12 py-8 text-xl shadow-2xl hover:shadow-pink-500/60 font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src={submitoLogo} 
              alt="Submito" 
              className="h-10 w-10" 
              style={{ filter: 'drop-shadow(0 0 20px hsl(var(--submito-cyan) / 0.4))' }}
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Submito
            </span>
          </div>
          <p className="text-muted-foreground text-base">© 2025 Submito. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
