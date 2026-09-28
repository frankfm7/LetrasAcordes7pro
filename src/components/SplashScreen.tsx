import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => onComplete(), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
      
      {/* Partículas de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Logo girando */}
      <div className="relative z-10 text-center">
        <div
          className={`w-40 h-40 mx-auto mb-8 rounded-3xl flex items-center justify-center text-white text-6xl font-black shadow-2xl transition-all duration-1000 ${
            phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`}
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)',
            animation: phase >= 1 ? 'spinIn 2s ease-out forwards' : 'none',
          }}
        >
          C7
        </div>

        {/* Título con efecto */}
        <div
          className={`transition-all duration-1000 ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h1 className="text-6xl font-black text-white mb-3 drop-shadow-2xl">
            Cancionero<span className="font-black bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">7Pro</span>
          </h1>
          <p className="text-white/90 text-xl font-light tracking-wide">Gestión Profesional de Alabanzas</p>
        </div>

        {/* Indicador de carga */}
        <div
          className={`mt-12 transition-all duration-1000 ${
            phase >= 3 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spinIn {
          0% {
            transform: rotate(-180deg) scale(0);
            opacity: 0;
          }
          50% {
            transform: rotate(10deg) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -20px) rotate(5deg); }
          50% { transform: translate(-10px, -40px) rotate(-5deg); }
          75% { transform: translate(20px, -20px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
