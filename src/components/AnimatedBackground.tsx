export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main gradient background - Dark Purple to Black */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0015] via-[#1a0b2e] to-[#000000]"></div>
      
      {/* Glowing orbs - Blue */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#3b82f6]/10 rounded-full blur-[120px] animate-pulse"></div>
      
      {/* Glowing orbs - Purple */}
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#8b5cf6]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Starry particles - smaller and more numerous */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.5 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>
      
      {/* Grid overlay - subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>
      
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
