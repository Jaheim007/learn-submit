import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Users, Zap, Shield, BarChart3, Clock, Sparkles } from 'lucide-react';
import submitoLogo from '@/assets/submito-logo.png';

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={submitoLogo} alt="Submito" className="h-10 w-10 animate-float" style={{ filter: 'drop-shadow(0 0 20px hsl(var(--submito-cyan) / 0.5))' }} />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Submito
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/etudiant/login')}
              className="hover:text-cyan-400 transition-colors"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 transition-opacity shadow-lg hover:shadow-cyan-500/50"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Streamline Your
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-scale-in">
                  Educational Workflow
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                The ultimate platform for managing student submissions, courses, and academic progress. Built for modern educational institutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 transition-all px-8 py-6 text-lg shadow-xl hover:shadow-cyan-500/50 group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/demo')}
                  className="border-2 border-cyan-500/20 hover:border-cyan-500/40 bg-background/10 backdrop-blur-sm px-8 py-6 text-lg"
                >
                  See Demo
                </Button>
              </div>
              {/* Social Proof */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 border-2 border-background" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-semibold">500+</span> educators trust Submito
                </p>
              </div>
            </div>

            {/* Hero Image/Card */}
            <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-pink-500 to-purple-500 rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <Card className="relative p-8 bg-card/50 backdrop-blur-xl border-border/40 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
                    <Button size="sm" variant="outline" className="text-xs">
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
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-all cursor-pointer group animate-slide-in-right"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <span className="text-sm text-muted-foreground w-20">{task.time}</span>
                      <div className={`h-8 w-24 rounded-md bg-gradient-to-r ${task.color} flex items-center justify-center text-xs font-medium text-white group-hover:scale-105 transition-transform`}>
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
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Maximize Productivity and Efficiency
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your educational institution, all in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i}
                className="p-6 bg-card/50 backdrop-blur-xl border-border/40 hover:border-cyan-500/40 transition-all cursor-pointer group hover-scale animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps and transform your educational workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <Card 
                key={i}
                className="p-8 bg-card/50 backdrop-blur-xl border-border/40 text-center hover:border-cyan-500/40 transition-all group animate-scale-in"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-cyan-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-gradient-to-br from-cyan-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-xl border-border/40 text-center animate-scale-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of educational institutions already using Submito to streamline their workflow
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 transition-all px-10 py-6 text-lg shadow-xl hover:shadow-cyan-500/50"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/40">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={submitoLogo} alt="Submito" className="h-8 w-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Submito
            </span>
          </div>
          <p>© 2025 Submito. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
