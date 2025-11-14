export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Main gradient background - Premium Blue/Purple */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(217,91%,15%)] to-[hsl(263,70%,15%)]"></div>
      
      {/* Glowing orb effect - top right */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(217,91%,60%)]/20 rounded-full blur-[120px] animate-pulse"></div>
      
      {/* Glowing orb effect - bottom left */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[hsl(263,70%,60%)]/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 opacity-15">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000,transparent)]"></div>
    </div>
  );
};
