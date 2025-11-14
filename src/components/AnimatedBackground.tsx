export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main gradient background - Deep Purple/Blue */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0015] via-[#1a0b2e] to-[#000000]"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#8b5cf6]/20 to-[#ec4899]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Flowing particles - larger and more dynamic */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 backdrop-blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              animation: `float ${Math.random() * 20 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>
      
      {/* Flowing lines/waves */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
            style={{
              top: `${(i + 1) * 20}%`,
              animation: `slideRight ${15 + i * 3}s linear infinite`,
              animationDelay: `${i * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Twinkling stars - smaller and more numerous */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={`star-${i}`}
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
      
      {/* Grid overlay - very subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% { 
            transform: translate(100px, -100px) scale(1.2);
            opacity: 0.7;
          }
          50% { 
            transform: translate(-50px, -200px) scale(0.8);
            opacity: 0.5;
          }
          75% { 
            transform: translate(-150px, -100px) scale(1.1);
            opacity: 0.6;
          }
        }
        
        @keyframes slideRight {
          0% { 
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% { 
            transform: translateX(200%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
