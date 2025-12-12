const FloatingOrbs = () => {
  return (
    <>
      {/* Top orb */}
      <div 
        className="absolute top-20 right-16 w-32 h-32 rounded-full bg-purple-400/40 blur-sm animate-float"
        style={{ animationDelay: '0s' }}
      />
      
      {/* Middle large orb */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-purple-300/30 blur-sm animate-float-slow"
        style={{ animationDelay: '2s' }}
      />
      
      {/* Bottom orb */}
      <div 
        className="absolute bottom-24 right-20 w-40 h-40 rounded-full bg-purple-800/50 blur-md animate-pulse-glow"
        style={{ animationDelay: '1s' }}
      />
      
      {/* Small accent orbs */}
      <div 
        className="absolute top-40 left-12 w-8 h-8 rounded-full bg-purple-200/60 animate-float"
        style={{ animationDelay: '3s' }}
      />
      <div 
        className="absolute bottom-40 left-24 w-12 h-12 rounded-full bg-purple-400/40 animate-float-slow"
        style={{ animationDelay: '4s' }}
      />
    </>
  );
};

export default FloatingOrbs;
