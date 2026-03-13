export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Main gradient background - Deep Navy */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050a1a] via-[#0a1628] to-[#0d0a14]"></div>
      
      {/* Animated gradient orbs - Navy + Red */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-[#1a2744]/30 to-[#dc2626]/8 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#dc2626]/12 to-[#1a2744]/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Flowing particles */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 5 + 2}px`,
              height: `${Math.random() * 5 + 2}px`,
              background: i % 3 === 0 
                ? 'rgba(220, 38, 38, 0.4)' 
                : 'rgba(100, 130, 200, 0.3)',
              animation: `float ${Math.random() * 20 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>
      
      {/* Flowing lines */}
      <div className="absolute inset-0 opacity-15">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full"
            style={{
              top: `${(i + 1) * 20}%`,
              background: i % 2 === 0 
                ? 'linear-gradient(to right, transparent, rgba(220, 38, 38, 0.4), transparent)'
                : 'linear-gradient(to right, transparent, rgba(100, 130, 200, 0.4), transparent)',
              animation: `slideRight ${15 + i * 3}s linear infinite`,
              animationDelay: `${i * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Twinkling stars */}
      <div className="absolute inset-0">
        {[...Array(80)].map((_, i) => (
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
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(100,130,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(100,130,200,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
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
