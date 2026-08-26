import FloatingOrbs from "./FloatingOrbs";
import { Sparkles } from "lucide-react";

const BrandPanel = () => {
  return (
    <div className="relative hidden lg:flex lg:w-1/2 xl:w-[45%] gradient-primary overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Floating orbs */}
      <FloatingOrbs />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 h-full w-full">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-semibold text-primary-foreground">
            ConnectHub
          </span>
        </div>
        
        {/* Main text */}
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-primary-foreground leading-tight animate-fade-in-up">
            Let's build something amazing today.
          </h1>
          <p className="text-lg text-primary-foreground/80 animate-fade-in-up animation-delay-200">
            Connect with friends, share moments, and discover new communities on the platform designed for authentic connections.
          </p>
        </div>
        
        {/* Bottom decorative element */}
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="w-8 h-8 rounded-full bg-primary-foreground/30 border-2 border-primary-foreground/20 backdrop-blur-sm"
              />
            ))}
          </div>
          <span className="text-sm text-primary-foreground/70">
            Join 10,000+ users already connected
          </span>
        </div>
      </div>
    </div>
  );
};

export default BrandPanel;
