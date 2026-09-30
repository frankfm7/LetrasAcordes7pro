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
  angle: number; // ángulo en grados (0 = 12 en punto, sentido horario)
}

export default function CircleOfFifths({ currentKey = 'C', onKeySelect, onClose }: CircleOfFifthsProps) {
  const [selectedKey, setSelectedKey] = useState(currentKey);
  const [needleAngle, setNeedleAngle] = useState(0);

  // Orden correcto del círculo de quintas empezando desde 12:00 en sentido horario
  // C (12:00) → G (1:00) → D (2:00) → A (3:00) → E (4:00) → B (5:00) → F#/Gb (6:00) → Db/C# (7:00) → Ab/G# (8:00) → Eb/D# (9:00) → Bb/A# (10:00) → F (11:00)
  const notes: NoteInfo[] = [
    { major: 'C', minor: 'Am', color: '#06B6D4', angle: 0 },      // 12:00 (0°)
    { major: 'G', minor: 'Em', color: '#10B981', angle: 30 },     // 1:00 (30°)
    { major: 'D', minor: 'Bm', color: '#3B82F6', angle: 60 },     // 2:00 (60°)
    { major: 'A', minor: 'F#m', color: '#8B5CF6', angle: 90 },    // 3:00 (90°)
    { major: 'E', minor: 'C#m', color: '#EC4899', angle: 120 },   // 4:00 (120°)
    { major: 'B', minor: 'G#m', color: '#F472B6', angle: 150 },   // 5:00 (150°)
    { major: 'F#/Gb', minor: 'D#m', color: '#EF4444', angle: 180 }, // 6:00 (180°)
    { major: 'Db/C#', minor: 'Bbm', color: '#F97316', angle: 210 }, // 7:00 (210°)
    { major: 'Ab/G#', minor: 'Fm', color: '#EAB308', angle: 240 },  // 8:00 (240°)
    { major: 'Eb/D#', minor: 'Cm', color: '#FACC15', angle: 270 },  // 9:00 (270°)
    { major: 'Bb/A#', minor: 'Gm', color: '#A3E635', angle: 300 },  // 10:00 (300°)
    { major: 'F', minor: 'Dm', color: '#22C55E', angle: 330 },      // 11:00 (330°)
  ];

  // Escalas para números romanos (orden del círculo de quintas)
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

  // Función para crear path de pétalo en forma de escudo
  const createPetalPath = (angle: number, innerRadius: number, outerRadius: number, width: number) => {
    // Convertir ángulo a radianes (0° = arriba, sentido horario)
    const rad = (angle - 90) * Math.PI / 180;
    
    // Centro del círculo
    const cx = 200;
    const cy = 200;
    
    // Punto central del pétalo
    const midRadius = (innerRadius + outerRadius) / 2;
    const midX = cx + Math.cos(rad) * midRadius;
    const midY = cy + Math.sin(rad) * midRadius;
    
    // Puntos en el borde interior (más estrecho)
    const innerWidth = width * 0.4;
    const innerRad1 = (angle - innerWidth - 90) * Math.PI / 180;
    const innerRad2 = (angle + innerWidth - 90) * Math.PI / 180;
    const innerX1 = cx + Math.cos(innerRad1) * innerRadius;
    const innerY1 = cy + Math.sin(innerRad1) * innerRadius;
    const innerX2 = cx + Math.cos(innerRad2) * innerRadius;
    const innerY2 = cy + Math.sin(innerRad2) * innerRadius;
    
    // Puntos en el borde exterior (más ancho)
    const outerWidth = width * 0.6;
    const outerRad1 = (angle - outerWidth - 90) * Math.PI / 180;
    const outerRad2 = (angle + outerWidth - 90) * Math.PI / 180;
    const outerX1 = cx + Math.cos(outerRad1) * outerRadius;
    const outerY1 = cy + Math.sin(outerRad1) * outerRadius;
    const outerX2 = cx + Math.cos(outerRad2) * outerRadius;
    const outerY2 = cy + Math.sin(outerRad2) * outerRadius;
    
    // Crear path con curvas suaves
    return `M ${innerX1} ${innerY1} 
            Q ${midX} ${midY} ${outerX1} ${outerY1}
            A ${outerRadius * 0.3} ${outerRadius * 0.3} 0 0 1 ${outerX2} ${outerY2}
            Q ${midX} ${midY} ${innerX2} ${innerY2}
            A ${innerRadius * 0.2} ${innerRadius * 0.2} 0 0 1 ${innerX1} ${innerY1}
            Z`;
  };

  // Función para obtener posición de texto
  const getTextPosition = (angle: number, radius: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: 200 + Math.cos(rad) * radius,
      y: 200 + Math.sin(rad) * radius,
    };
  };

  // Calcular posiciones de los números romanos basados en la nota seleccionada
  const getRomanNumeralPositions = () => {
    const selectedNote = notes.find(n => n.major === selectedKey || n.minor === selectedKey);
    if (!selectedNote) return [];

    const baseAngle = selectedNote.angle;
    return romanNumerals.map((numeral, index) => {
      // Cada número romano está a 30° de distancia en sentido horario
      const angle = (baseAngle + index * 30) % 360;
      const pos = getTextPosition(angle, 195);
      return { numeral, x: pos.x, y: pos.y };
    });
  };

  const romanPositions = getRomanNumeralPositions();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" 
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl rounded-2xl p-6 my-8" 
        style={{ backgroundColor: 'var(--card-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar - UN SOLO BOTÓN con flecha ‹ */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-50 shadow-lg"
          style={{ color: 'white' }}
          title="Volver"
        >
          ‹
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
          Círculo de Quintas
        </h2>

        {/* SVG del Círculo de Quintas */}
        <div className="relative mx-auto" style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1' }}>
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* Fondo negro del círculo */}
            <circle cx="200" cy="200" r="180" fill="#1a1a1a" />
            
            {/* Anillo dorado exterior */}
            <circle cx="200" cy="200" r="180" fill="none" stroke="#D4AF37" strokeWidth="7" />
            <circle cx="200" cy="200" r="173" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />

            {/* Pétalos de notas mayores (anillo exterior) */}
            {notes.map((note, index) => {
              const isSelected = note.major === selectedKey || note.minor === selectedKey;
              const isRelated = note.major === selectedKey.replace('m', '') || note.minor === selectedKey;
              const path = createPetalPath(note.angle, 110, 170, 12);
              
              return (
                <g key={`major-${index}`} style={{ cursor: 'pointer' }}>
                  <path
                    d={path}
                    fill={note.color}
                    stroke={isSelected && !selectedKey.endsWith('m') ? 'white' : isRelated ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}
                    strokeWidth={isSelected ? 3 : isRelated ? 2 : 1}
                    opacity={isSelected ? 1 : 0.9}
                    onClick={() => handleNoteClick(note, false)}
                    style={{
                      transition: 'all 0.3s ease',
                      filter: isSelected ? 'brightness(1.2) drop-shadow(0 0 8px rgba(255,255,255,0.6))' : 'none',
                    }}
                  />
                  {/* Texto de la nota mayor */}
                  {(() => {
                    const pos = getTextPosition(note.angle, 145);
                    return (
                      <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="18"
                        fontWeight="bold"
                        style={{ pointerEvents: 'none', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                      >
                        {note.major}
                      </text>
                    );
                  })()}
                </g>
              );
            })}

            {/* Pétalos de notas menores (anillo interior) */}
            {notes.map((note, index) => {
              const isSelected = note.minor === selectedKey;
              const isRelated = note.major === selectedKey;
              const path = createPetalPath(note.angle, 60, 105, 10);
              
              return (
                <g key={`minor-${index}`} style={{ cursor: 'pointer' }}>
                  <path
                    d={path}
                    fill={note.color}
                    stroke={isSelected ? 'white' : isRelated ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}
                    strokeWidth={isSelected ? 3 : isRelated ? 2 : 1}
                    opacity={isSelected ? 1 : 0.7}
                    onClick={() => handleNoteClick(note, true)}
                    style={{
                      transition: 'all 0.3s ease',
                      filter: isSelected ? 'brightness(1.2) drop-shadow(0 0 8px rgba(255,255,255,0.6))' : 'none',
                    }}
                  />
                  {/* Texto de la nota menor */}
                  {(() => {
                    const pos = getTextPosition(note.angle, 85);
                    return (
                      <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        style={{ pointerEvents: 'none', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                      >
                        {note.minor}
                      </text>
                    );
                  })()}
                </g>
              );
            })}

            {/* Centro dorado */}
            <circle cx="200" cy="200" r="45" fill="#D4AF37" />
            <circle cx="200" cy="200" r="40" fill="#1a1a1a" />
            <circle cx="200" cy="200" r="35" fill="#D4AF37" opacity="0.3" />

            {/* Aguja central */}
            <g style={{ 
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: '200px 200px',
              transition: 'transform 0.5s ease-out'
            }}>
              {/* Línea de la aguja */}
              <line
                x1="200"
                y1="200"
                x2="200"
                y2="60"
                stroke="#4169E1"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Punta de la aguja */}
              <polygon
                points="200,50 195,70 205,70"
                fill="#4169E1"
              />
              {/* Centro de la aguja */}
              <circle cx="200" cy="200" r="8" fill="#4169E1" />
              <circle cx="200" cy="200" r="4" fill="white" />
            </g>

            {/* Números romanos (fijos alrededor del círculo) */}
            {romanPositions.map((pos, index) => (
              <text
                key={`roman-${index}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#D4AF37"
                fontSize="14"
                fontWeight="bold"
                style={{ 
                  textShadow: '0 0 5px rgba(212, 175, 55, 0.8)',
                  transition: 'all 0.3s ease'
                }}
              >
                {pos.numeral}
              </text>
            ))}
          </svg>
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
          <p>💡 Haz clic en una nota mayor (pétalo exterior) o menor (pétalo interior) para transponer la canción</p>
          <p className="mt-1 text-xs">Los números romanos muestran los grados de la escala seleccionada</p>
        </div>
      </div>
    </div>
  );
}
