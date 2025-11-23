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
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12 animate-fade-in">
              <div className="space-y-8">
                <h1 className="text-7xl md:text-8xl font-bold leading-[1.05] tracking-tight">
                  Transform Your
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-scale-in inline-block">
                    Academic Excellence
                  </span>
                </h1>
                <p className="text-2xl md:text-3xl text-muted-foreground max-w-2xl leading-relaxed font-light">
                  A comprehensive platform designed for modern educational institutions to streamline course delivery, student management, and academic progress tracking.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 pt-6">
                <Button 
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 transition-all px-12 py-8 text-xl shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 group font-semibold rounded-2xl"
                >
                  Start Free Trial
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/organization/signin')}
                  className="border-2 border-border/40 hover:border-cyan-500/60 bg-background/50 backdrop-blur-sm px-12 py-8 text-xl hover:bg-background/80 font-semibold rounded-2xl"
                >
                  Sign In
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/20">
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">500+</div>
                  <div className="text-sm text-muted-foreground mt-1">Organizations</div>
                </div>
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">10K+</div>
                  <div className="text-sm text-muted-foreground mt-1">Active Students</div>
                </div>
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">98%</div>
                  <div className="text-sm text-muted-foreground mt-1">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative animate-fade-in hidden lg:block" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-pink-500/20 to-purple-500/20 rounded-[3rem] blur-[120px] animate-pulse" />
              <div className="relative space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-8 bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl hover:border-cyan-500/40 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Users className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">2.4K</div>
                        <div className="text-sm text-muted-foreground">Students</div>
                      </div>
                    </div>
                    <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                      <div className="h-full w-[78%] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                    </div>
                  </Card>
                  
                  <Card className="p-8 bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl hover:border-pink-500/40 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">94%</div>
                        <div className="text-sm text-muted-foreground">Complete</div>
                      </div>
                    </div>
                    <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                      <div className="h-full w-[94%] bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
                    </div>
                  </Card>
                </div>

                {/* Activity Timeline */}
                <Card className="p-8 bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Sarah Johnson', action: 'submitted project', time: '2m ago', color: 'from-cyan-500 to-blue-500' },
                      { name: 'Michael Chen', action: 'joined class', time: '15m ago', color: 'from-pink-500 to-purple-500' },
                      { name: 'Emma Wilson', action: 'completed course', time: '1h ago', color: 'from-green-500 to-emerald-500' },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-background/40 hover:bg-background/60 transition-all group cursor-pointer">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activity.color} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                          {activity.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{activity.name}</div>
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
      <section className="py-32 px-6 relative bg-muted/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 animate-fade-in">
            <div className="inline-block px-6 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-semibold mb-6">
              Powerful Features
            </div>
            <h2 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Comprehensive tools to manage every aspect of your educational institution with ease and efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card 
                key={i}
                className="p-10 bg-card/50 backdrop-blur-2xl border border-border/30 hover:border-cyan-500/40 transition-all cursor-pointer group hover:-translate-y-2 animate-fade-in rounded-3xl"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 via-pink-500 to-purple-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xl">
                    <feature.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 animate-fade-in">
            <div className="inline-block px-6 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 text-sm font-semibold mb-6">
              Simple Process
            </div>
            <h2 className="text-6xl md:text-7xl font-bold mb-8">Get Started in Minutes</h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Three simple steps to transform your educational workflow
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 opacity-20 -translate-y-1/2" />
            
            <div className="grid md:grid-cols-3 gap-12 relative">
              {steps.map((step, i) => (
                <Card 
                  key={i}
                  className="p-12 bg-card/50 backdrop-blur-2xl border border-border/30 text-center hover:border-cyan-500/40 transition-all group animate-scale-in hover:-translate-y-3 rounded-3xl relative"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-pink-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all">
                    {i + 1}
                  </div>
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center mb-8 mt-4 group-hover:scale-110 transition-transform">
                    <step.icon className="h-12 w-12 text-cyan-400" />
                  </div>
                  <h3 className="text-3xl font-bold mb-6 group-hover:text-cyan-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed font-light">
                    {step.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <Card className="relative p-20 bg-gradient-to-br from-cyan-500/5 via-pink-500/5 to-purple-500/5 backdrop-blur-2xl border border-border/30 text-center animate-scale-in rounded-[3rem] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-pink-500/10 to-purple-500/10" 
                 style={{
                   backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--submito-cyan) / 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(var(--submito-pink) / 0.15) 0%, transparent 50%)'
                 }}
            />
            <div className="relative z-10">
              <h2 className="text-6xl md:text-8xl font-bold mb-10 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Ready to Transform?
              </h2>
              <p className="text-2xl md:text-3xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed font-light">
                Join thousands of educators and institutions already streamlining their workflow with Submito
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:opacity-90 hover:scale-105 transition-all px-16 py-10 text-2xl shadow-2xl hover:shadow-pink-500/60 font-semibold rounded-2xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-4 h-7 w-7" />
                </Button>
              </div>
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
