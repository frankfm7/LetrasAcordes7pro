import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

const INSTRUMENTS = {
  guitar: {
    name: '🎸 Guitarra',
    strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    frequencies: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]
  },
  bass: {
    name: '🎸 Bajo',
    strings: ['E1', 'A1', 'D2', 'G2'],
    frequencies: [41.20, 55.00, 73.42, 98.00]
  },
  ukulele: {
    name: '🎻 Ukelele',
    strings: ['G4', 'C4', 'E4', 'A4'],
    frequencies: [392.00, 261.63, 329.63, 440.00]
  }
};

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function Tuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [cents, setCents] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<'guitar' | 'bass' | 'ukulele'>('guitar');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const startListening = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      detectPitch();
    } catch (err) {
      setError('No se pudo acceder al micrófono');
      console.error(err);
    }
  };

  const stopListening = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsListening(false);
    setDetectedNote(null);
    setFrequency(null);
    setCents(0);
  };

  const detectPitch = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    const rms = Math.sqrt(buffer.reduce((sum, val) => sum + val * val, 0) / buffer.length);
    
    if (rms > 0.01) {
      let correlations = new Array(buffer.length).fill(0);
      for (let i = 0; i < buffer.length; i++) {
        for (let j = 0; j < buffer.length - i; j++) {
          correlations[i] += buffer[j] * buffer[j + i];
        }
      }

      let foundPeak = false;
      let peakIndex = 0;
      for (let i = 1; i < correlations.length; i++) {
        if (correlations[i] > correlations[i - 1] && !foundPeak) {
          foundPeak = true;
        }
        if (foundPeak && correlations[i] < correlations[i - 1]) {
          peakIndex = i - 1;
          break;
        }
      }

      if (peakIndex > 0 && audioContextRef.current) {
        const freq = audioContextRef.current.sampleRate / peakIndex;
        if (freq > 50 && freq < 2000) {
          setFrequency(freq);
          
          let closestNote = NOTES[0];
          let minDiff = Infinity;
          NOTES.forEach(note => {
            const noteFreq = getNoteFrequency(note);
            const diff = Math.abs(freq - noteFreq);
            if (diff < minDiff) {
              minDiff = diff;
              closestNote = note;
            }
          });
          
          setDetectedNote(closestNote);
          
          const noteFreq = getNoteFrequency(closestNote);
          const centsDiff = 1200 * Math.log2(freq / noteFreq);
          setCents(Math.round(centsDiff));
        }
      }
    }

    animationRef.current = requestAnimationFrame(detectPitch);
  };

  const getNoteFrequency = (note: string): number => {
    const noteIndex = NOTES.indexOf(note.replace(/\d/, ''));
    if (noteIndex === -1) return 440;
    const octave = parseInt(note.slice(-1)) || 4;
    return 440 * Math.pow(2, (noteIndex - 9) / 12 + (octave - 4));
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const getTuningStatus = () => {
    if (Math.abs(cents) < 5) return { text: '¡Perfecto!', color: '#10b981' };
    if (Math.abs(cents) < 15) return { text: 'Casi', color: '#f59e0b' };
    return { text: 'Desafinado', color: '#ef4444' };
  };

  const status = getTuningStatus();
  const instrument = INSTRUMENTS[selectedInstrument];

  return (
    <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">🎼 Afinador</h3>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Instrumento</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(INSTRUMENTS) as Array<keyof typeof INSTRUMENTS>).map(inst => (
            <button key={inst} onClick={() => setSelectedInstrument(inst)}
                    className="py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      backgroundColor: selectedInstrument === inst ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: selectedInstrument === inst ? 'white' : 'var(--text-primary)'
                    }}>
              {INSTRUMENTS[inst].name}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-7xl font-black mb-2" style={{ color: detectedNote ? 'var(--accent)' : 'var(--text-muted)' }}>
          {detectedNote || '—'}
        </div>
        {frequency && (
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            {frequency.toFixed(1)} Hz
          </div>
        )}
        {detectedNote && (
          <div className="text-lg font-bold" style={{ color: status.color }}>
            {status.text}
          </div>
        )}
      </div>

      {detectedNote && (
        <div className="mb-6">
          <div className="relative h-8 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5" style={{ backgroundColor: 'var(--text-muted)' }} />
            <div className="absolute top-0 bottom-0 w-4 rounded-full transition-all"
                 style={{
                   left: `${50 + (cents / 50) * 50}%`,
                   transform: 'translateX(-50%)',
                   backgroundColor: status.color
                 }} />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>-50</span>
            <span>0</span>
            <span>+50</span>
          </div>
          <div className="text-center text-sm font-bold mt-2" style={{ color: status.color }}>
            {cents > 0 ? '+' : ''}{cents} cents
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Cuerdas de referencia</label>
        <div className="grid grid-cols-3 gap-2">
          {instrument.strings.map((string, i) => (
            <div key={i} className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="font-bold text-lg">{string}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{instrument.frequencies[i].toFixed(1)} Hz</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={isListening ? stopListening : startListening}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg"
              style={{ backgroundColor: isListening ? '#ef4444' : 'var(--accent)', color: 'white' }}>
        {isListening ? <><MicOff size={24} /> Detener</> : <><Mic size={24} /> Escuchar</>}
      </button>

      {isListening && (
        <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
          Toca una cuerda cerca del micrófono
        </p>
      )}
    </div>
  );
}
