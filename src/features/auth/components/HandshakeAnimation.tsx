const HandshakeAnimation = () => {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      {/* Left person */}
      <div className="absolute left-1/4 animate-slide-in-left">
        <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <circle cx="40" cy="20" r="18" className="fill-primary/90" />
          {/* Body */}
          <path d="M20 45 L40 38 L60 45 L55 85 L25 85 Z" className="fill-primary/80" />
          {/* Arm extending right */}
          <path 
            d="M55 50 L85 60" 
            className="stroke-primary/80" 
            strokeWidth="8" 
            strokeLinecap="round"
            style={{ animation: 'arm-extend 2s ease-in-out infinite' }}
          />
          {/* Legs */}
          <path d="M30 85 L28 115" className="stroke-primary/70" strokeWidth="8" strokeLinecap="round" />
          <path d="M50 85 L52 115" className="stroke-primary/70" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>

      {/* Handshake in center */}
      <div className="z-10 animate-pulse-shake">
        <svg width="60" height="50" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Left hand */}
          <path 
            d="M5 25 L20 25 L25 20 L30 25" 
            className="stroke-foreground" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Right hand */}
          <path 
            d="M55 25 L40 25 L35 20 L30 25" 
            className="stroke-foreground" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Clasp */}
          <circle cx="30" cy="23" r="8" className="fill-foreground/90" />
          {/* Sparkles */}
          <circle cx="15" cy="10" r="2" className="fill-primary animate-twinkle" />
          <circle cx="45" cy="10" r="2" className="fill-primary animate-twinkle" style={{ animationDelay: '0.3s' }} />
          <circle cx="30" cy="5" r="2.5" className="fill-primary animate-twinkle" style={{ animationDelay: '0.6s' }} />
        </svg>
      </div>

      {/* Right person */}
      <div className="absolute right-1/4 animate-slide-in-right">
        <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <circle cx="40" cy="20" r="18" className="fill-accent/90" />
          {/* Body */}
          <path d="M20 45 L40 38 L60 45 L55 85 L25 85 Z" className="fill-accent/80" />
          {/* Arm extending left */}
          <path 
            d="M25 50 L-5 60" 
            className="stroke-accent/80" 
            strokeWidth="8" 
            strokeLinecap="round"
            style={{ animation: 'arm-extend 2s ease-in-out infinite' }}
          />
          {/* Legs */}
          <path d="M30 85 L28 115" className="stroke-accent/70" strokeWidth="8" strokeLinecap="round" />
          <path d="M50 85 L52 115" className="stroke-accent/70" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>

      {/* Floating particles */}
      <div className="absolute top-4 left-1/3 w-3 h-3 rounded-full bg-primary/40 animate-float" />
      <div className="absolute top-8 right-1/3 w-2 h-2 rounded-full bg-accent/50 animate-float-slow" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-8 left-1/2 w-2.5 h-2.5 rounded-full bg-primary/30 animate-float" style={{ animationDelay: '2s' }} />
    </div>
  );
};

export default HandshakeAnimation;
