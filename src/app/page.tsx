import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";
import { Briefcase } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4 md:p-8">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Centered container */}
      <div className="relative z-10 w-full max-w-5xl bg-card rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="flex flex-col lg:flex-row-reverse">

          {/* Right side - Form */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 md:p-8 lg:p-12">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary shadow-purple">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">
                Cocpit
              </span>
            </div>

            <LoginForm />
          </div>

          {/* Left side - Branding with animation */}
          <div className="hidden lg:flex w-full lg:w-1/2 gradient-primary p-8 md:p-12 flex-col justify-center items-center relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }} />
            </div>

            {/* Floating orbs */}
            <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-accent/30 blur-sm animate-float" />
            <div className="absolute bottom-16 left-8 w-16 h-16 rounded-full bg-primary/20 blur-sm animate-float-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/3 left-16 w-8 h-8 rounded-full bg-accent/40 animate-pulse-glow" />

            {/* Content */}
            <div className="relative z-10 text-center space-y-6 w-full flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight animate-fade-in-up">
                Connect. Grow. Succeed.
              </h2>
              <p className="text-white text-base md:text-lg animate-fade-in-up animation-delay-200">
                Where professionals meet opportunities. Build meaningful connections that accelerate your career.
              </p>

              {/* Handshake image */}
              <div className="py-8 animate-fade-in-up animation-delay-400 flex-1 flex items-center justify-center">
                <Image
                  src="/assets/pngegg.png"
                  alt="Handshake"
                  width={400}
                  height={300}
                  className="w-full h-auto max-w-md"
                />
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-3 animate-fade-in-up animation-delay-600">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-foreground/30 border-2 border-foreground/20 backdrop-blur-sm"
                    />
                  ))}
                </div>
                <span className="text-sm text-white">
                  10K+ professionals
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
