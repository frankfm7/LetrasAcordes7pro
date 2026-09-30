import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CircleOfFifthsProps {
  currentKey?: string;
  onKeySelect?: (key: string) => void;
  onClose?: () => void;
}

interface NoteInfo {
  major: string;
  minor: string;
  color: string;
  angle: number;
}

export default function CircleOfFifths({ currentKey = 'C', onKeySelect, onClose }: CircleOfFifthsProps) {
  const [selectedKey, setSelectedKey] = useState(currentKey);
  const [needleAngle, setNeedleAngle] = useState(0);

  // Orden del círculo de quintas (sentido horario)
  const notes: NoteInfo[] = [
    { major: 'C', minor: 'Am', color: '#06B6D4', angle: 0 },      // 12:00
    { major: 'G', minor: 'Em', color: '#10B981', angle: 30 },     // 1:00
    { major: 'D', minor: 'Bm', color: '#3B82F6', angle: 60 },     // 2:00
    { major: 'A', minor: 'F#m', color: '#8B5CF6', angle: 90 },    // 3:00
    { major: 'E', minor: 'C#m', color: '#EC4899', angle: 120 },   // 4:00
    { major: 'B', minor: 'G#m', color: '#F472B6', angle: 150 },   // 5:00
    { major: 'F#/Gb', minor: 'D#m/Ebm', color: '#EF4444', angle: 180 }, // 6:00
    { major: 'Db/C#', minor: 'Bbm/A#m', color: '#F97316', angle: 210 }, // 7:00
    { major: 'Ab/G#', minor: 'Fm/E#m', color: '#EAB308', angle: 240 },  // 8:00
    { major: 'Eb/D#', minor: 'Cm', color: '#FACC15', angle: 270 },      // 9:00
    { major: 'Bb/A#', minor: 'Gm', color: '#A3E635', angle: 300 },      // 10:00
    { major: 'F', minor: 'Dm', color: '#22C55E', angle: 330 },          // 11:00
  ];

  // Escalas para números romanos
  const majorScales: Record<string, string[]> = {
    'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
    'F#/Gb': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
    'Db/C#': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    'Ab/G#': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    'Eb/D#': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    'Bb/A#': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  };

  const minorScales: Record<string, string[]> = {
    'Am': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    'Em': ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    'Bm': ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
    'F#m': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
    'C#m': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
    'G#m': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
    'D#m': ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
    'Bbm': ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
    'Fm': ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
    'Cm': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    'Gm': ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
    'Dm': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
  };

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  // Actualizar ángulo de la aguja cuando cambia la nota seleccionada
  useEffect(() => {
    const note = notes.find(n => n.major === selectedKey || n.minor === selectedKey);
    if (note) {
      setNeedleAngle(note.angle);
    }
  }, [selectedKey]);

  // Sincronizar con currentKey
  useEffect(() => {
    setSelectedKey(currentKey);
  }, [currentKey]);

  const handleNoteClick = (note: NoteInfo, isMinor: boolean = false) => {
    const key = isMinor ? note.minor : note.major;
    setSelectedKey(key);
    if (onKeySelect) {
      onKeySelect(key);
    }
  };

  const getCurrentScale = () => {
    const isMinor = selectedKey.endsWith('m') && !selectedKey.endsWith('#m');
    if (isMinor) {
      return minorScales[selectedKey] || [];
    }
    return majorScales[selectedKey] || [];
  };

  const currentScale = getCurrentScale();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="relative w-full max-w-lg rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }}>
        {/* Botón cerrar */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            <X size={24} />
          </button>
        )}

        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
          Círculo de Quintas
        </h2>

        {/* Círculo principal */}
        <div className="relative mx-auto" style={{ width: '350px', height: '350px' }}>
          {/* Círculo exterior con borde dorado */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: '#1a1a1a',
              border: '6px solid #D4AF37',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
            }}
          />

          {/* Pétalos de notas */}
          {notes.map((note, index) => {
            const isSelected = note.major === selectedKey || note.minor === selectedKey;
            const isRelated = note.major === selectedKey.replace('m', '') || note.minor === selectedKey;
            
            return (
              <div
                key={index}
                className="absolute"
                style={{
                  width: '100%',
                  height: '100%',
                  top: 0,
                  left: 0,
                  transform: `rotate(${note.angle}deg)`,
                }}
              >
                {/* Pétalo mayor */}
                <button
                  onClick={() => handleNoteClick(note, false)}
                  className="absolute transition-all duration-200 hover:scale-110"
                  style={{
                    width: '70px',
                    height: '90px',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: note.color,
                    borderRadius: '35px 35px 15px 15px',
                    border: isSelected && !selectedKey.endsWith('m') ? '3px solid white' : isRelated ? '2px solid rgba(255,255,255,0.5)' : 'none',
                    boxShadow: isSelected ? '0 0 15px rgba(255,255,255,0.8)' : '0 4px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span className="text-white font-bold text-lg">{note.major}</span>
                </button>

                {/* Pétalo menor */}
                <button
                  onClick={() => handleNoteClick(note, true)}
                  className="absolute transition-all duration-200 hover:scale-110"
                  style={{
                    width: '50px',
                    height: '60px',
                    top: '115px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: note.color,
                    opacity: 0.7,
                    borderRadius: '25px 25px 10px 10px',
                    border: isSelected && selectedKey.endsWith('m') ? '3px solid white' : isRelated ? '2px solid rgba(255,255,255,0.5)' : 'none',
                    boxShadow: isSelected ? '0 0 15px rgba(255,255,255,0.8)' : '0 2px 4px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span className="text-white font-bold text-xs">{note.minor}</span>
                </button>
              </div>
            );
          })}

          {/* Centro del círculo con aguja */}
          <div
            className="absolute rounded-full"
            style={{
              width: '60px',
              height: '60px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#D4AF37',
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
              zIndex: 10,
            }}
          >
            {/* Aguja */}
            <div
              className="absolute transition-transform duration-500 ease-out"
              style={{
                width: '4px',
                height: '80px',
                backgroundColor: '#4169E1',
                top: '-50px',
                left: '50%',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                borderRadius: '2px',
                boxShadow: '0 0 5px rgba(65, 105, 225, 0.8)',
              }}
            />
          </div>

          {/* Números romanos */}
          {romanNumerals.map((numeral, index) => {
            const angle = (index * 360) / 7;
            const radius = 190;
            const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
            const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
            
            return (
              <div
                key={index}
                className="absolute text-sm font-bold"
                style={{
                  top: `calc(50% + ${y}px)`,
                  left: `calc(50% + ${x}px)`,
                  transform: 'translate(-50%, -50%)',
                  color: '#D4AF37',
                  textShadow: '0 0 5px rgba(212, 175, 55, 0.5)',
                }}
              >
                {numeral}
              </div>
            );
          })}
        </div>

        {/* Información de la escala actual */}
        <div className="mt-8 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="text-lg font-bold mb-3 text-center" style={{ color: 'var(--text-primary)' }}>
            Escala de {selectedKey}
          </h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {currentScale.map((note, index) => (
              <div
                key={index}
                className="px-3 py-2 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  minWidth: '50px',
                }}
              >
                <div className="text-xs font-bold">{romanNumerals[index]}</div>
                <div className="text-sm font-bold">{note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>Haz clic en una nota mayor (pétalo grande) o menor (pétalo pequeño) para transponer la canción</p>
        </div>
      </div>
    </div>
  );
}
