import React from "react";
import { 
  Sparkles, 
  Chrome, 
  Zap, 
  Brain, 
  Rocket, 
  Github, 
  Twitter, 
  Globe,
  ExternalLink,
  ShieldCheck,
  Layout,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const AboutUs = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-12">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-4 h-4" />
          The Future of Focused Learning
        </div>
        <h1 className="text-5xl font-serif font-bold text-gradient leading-tight">
          Master Your Focus, <br /> Accelerate Your Learning
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          FocusFlow is an ADHD-friendly ecosystem designed to transform how you consume information. 
          We use cutting-edge AI to distill complex content into digestible, actionable insights.
        </p>
      </section>

      {/* Extension Feature Card */}
      <section className="glass-card overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="grid md:grid-cols-2 gap-8 items-center p-8 lg:p-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-accent font-bold text-sm tracking-widest uppercase">
              <Chrome className="w-5 h-5" />
              FocusFlow Anywhere
            </div>
            <h2 className="text-3xl font-serif font-bold">The Browser Extension</h2>
            <p className="text-muted-foreground leading-relaxed">
              Don't let the flow stop at our dashboard. Our browser extension brings 
              FocusFlow's intelligence directly to your research path. Summarize articles, 
              capture key insights from YouTube, and sync everything to your labs with a single click.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center text-sage-600">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Instant Summarization on any website</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">AI-Powered deep analysis in situ</span>
              </div>
            </div>
            <Button className="w-full md:w-auto gap-2 shadow-lg shadow-primary/20 group">
              Get the Extension
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="relative aspect-square md:aspect-auto h-64 md:h-full bg-muted rounded-2xl border border-border/50 overflow-hidden flex items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-50" />
            <Chrome className="w-32 h-32 text-primary/20 animate-pulse group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-border shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Active Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Facilities */}
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard 
          icon={<Brain className="w-6 h-6 text-purple-500" />}
          title="Cognitive Optimization"
          description="Designed specifically for ADHD brains, minimizing distraction and maximizing retention."
        />
        <FeatureCard 
          icon={<Layout className="w-6 h-6 text-blue-500" />}
          title="Universal Input"
          description="From PDFs to YouTube videos and web articles, process everything in one unified dashboard."
        />
        <FeatureCard 
          icon={<ShieldCheck className="w-6 h-6 text-sage-600" />}
          title="Secure & Private"
          description="Your thoughts and learning materials are encrypted and stored with the highest security standards."
        />
      </div>

      {/* Footer / CTA */}
      <footer className="pt-12 border-t border-border/50 text-center space-y-6">
        <div className="flex justify-center gap-8 mb-4">
          <Github className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
          <Twitter className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
          <Globe className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
        </div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            Made for curious minds.
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="glass-card p-8 space-y-4 hover:border-primary/30 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/5 transition-colors">
      {icon}
    </div>
    <h3 className="text-lg font-bold">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed italic">
      "{description}"
    </p>
  </div>
);
