import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';

export default function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState(4);
  const [soundType, setSoundType] = useState<'wood' | 'beep' | 'click'>('wood');
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTapRef = useRef<number>(0);

  const playSound = useCallback((isAccent: boolean) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (soundType === 'wood') {
      oscillator.frequency.value = isAccent ? 1200 : 800;
      oscillator.type = 'triangle';
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    } else if (soundType === 'beep') {
      oscillator.frequency.value = isAccent ? 1000 : 600;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } else {
      oscillator.frequency.value = isAccent ? 1500 : 1000;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    }
  }, [soundType]);

  useEffect(() => {
    if (isPlaying) {
      const interval = 60000 / bpm;
      let currentBeat = 0;
      playSound(true);
      setBeat(0);
      intervalRef.current = window.setInterval(() => {
        currentBeat = (currentBeat + 1) % timeSignature;
        setBeat(currentBeat);
        playSound(currentBeat === 0);
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, bpm, timeSignature, playSound]);

  const reset = () => {
    setIsPlaying(false);
    setBeat(0);
  };

  const handleTapTempo = () => {
    const now = Date.now();
    if (lastTapRef.current > 0) {
      const diff = now - lastTapRef.current;
      if (diff < 2000) {
        const newBpm = Math.round(60000 / diff);
        if (newBpm >= 30 && newBpm <= 240) {
          setBpm(newBpm);
        }
      }
    }
    lastTapRef.current = now;
    
    setTimeout(() => {
      if (Date.now() - lastTapRef.current >= 2000) {
        lastTapRef.current = 0;
      }
    }, 2000);
  };

  return (
    <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">🎵 Metrónomo</h3>
      
      <div className="text-center mb-6">
        <div className="text-6xl font-black mb-2" style={{ color: 'var(--accent)' }}>{bpm}</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>BPM</div>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: timeSignature }).map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-full transition-all"
               style={{
                 backgroundColor: beat === i && isPlaying ? (i === 0 ? 'var(--gold)' : 'var(--accent)') : 'var(--bg-tertiary)',
                 transform: beat === i && isPlaying ? 'scale(1.3)' : 'scale(1)',
                 boxShadow: beat === i && isPlaying ? '0 0 12px var(--accent)' : 'none'
               }} />
        ))}
      </div>

      <div className="mb-6">
        <input type="range" min="30" max="240" value={bpm} onChange={e => setBpm(Number(e.target.value))}
               className="w-full accent-purple-600" />
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          <span>30</span><span>240</span>
        </div>
      </div>

      <div className="mb-6">
        <button onClick={handleTapTempo}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', border: '2px solid var(--accent)' }}>
          <Zap size={20} /> Tap Tempo
        </button>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          Toca el botón al ritmo deseado
        </p>
      </div>

      <div className="mb-6">
        <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tipo de Sonido</label>
        <div className="grid grid-cols-3 gap-2">
          {[{ value: 'wood', label: '🥁 Madera' }, { value: 'beep', label: '🔔 Beep' }, { value: 'click', label: '👆 Click' }].map(sound => (
            <button key={sound.value} onClick={() => setSoundType(sound.value as any)}
                    className="py-3 rounded-xl text-xs font-bold transition-all"
                    style={{
                      backgroundColor: soundType === sound.value ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: soundType === sound.value ? 'white' : 'var(--text-primary)'
                    }}>
              {sound.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Compás</label>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6, 7].map(ts => (
            <button key={ts} onClick={() => setTimeSignature(ts)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      backgroundColor: timeSignature === ts ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: timeSignature === ts ? 'white' : 'var(--text-primary)'
                    }}>
              {ts}/4
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={reset} className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <RotateCcw size={18} /> Reset
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)}
                className="flex-[2] py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: isPlaying ? '#ef4444' : 'var(--accent)', color: 'white' }}>
          {isPlaying ? <><Pause size={18} /> Detener</> : <><Play size={18} /> Iniciar</>}
        </button>
      </div>

      <div className="mt-4">
        <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Presets</label>
        <div className="grid grid-cols-4 gap-2">
          {[{ label: 'Lento', bpm: 60 }, { label: 'Normal', bpm: 100 }, { label: 'Rápido', bpm: 140 }, { label: 'Muy Rápido', bpm: 180 }].map(p => (
            <button key={p.label} onClick={() => setBpm(p.bpm)}
                    className="py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              {p.label} ({p.bpm})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
