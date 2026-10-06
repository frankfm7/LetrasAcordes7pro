import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
    setTimeout(() => onComplete(), 2500);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="text-center">
        {showContent && (
          <div className="mb-8 animate-spin-once">
            <div className="w-32 h-32 mx-auto rounded-3xl flex items-center justify-center text-white text-5xl font-black shadow-2xl" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' }}>
              C7
            </div>
          </div>
        )}
        {showContent && (
          <div className="animate-fade-in">
            <h1 className="text-5xl font-black text-white mb-2">Cancionero<span className="font-black">7Pro</span></h1>
            <p className="text-white/80 text-lg">Gestión Profesional de Alabanzas</p>
          </div>
        )}
        {showContent && (
          <div className="mt-12 flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>
    </div>
  );
}
