import { useState } from 'react';
import { Hymnal } from '../types';
import { useApp } from '../context/AppContext';
import { X, Check } from 'lucide-react';

const ICONS = ['🎵', '🎶', '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '⛪', '🏔️', '🌿', '✍️', '📖', '🕊️', '⭐', '🌟', '🎼', '🎯', '❤️', '🔥'];
const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#22c55e', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#6366f1', '#14b8a6'];

export default function AddHymnalModal({ onClose }: { onClose: () => void }) {
  const { addCustomHymnal } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('Castellano');
  const [icon, setIcon] = useState('🎵');
  const [color, setColor] = useState('#a855f7');
  const [codePrefix, setCodePrefix] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    const prefix = codePrefix.trim() || name.trim().charAt(0).toUpperCase();
    const newHymnal: Hymnal = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      language,
      icon,
      color,
      isCustom: true,
      codePrefix: prefix,
    };
    addCustomHymnal(newHymnal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Nuevo Himnario</h3>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Himnario Pentecostal"
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Descripción</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción breve"
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Idioma</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option>Castellano</option><option>Aymara</option><option>Quechua</option><option>Portugués</option><option>Inglés</option><option>Bilingüe</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Prefijo de Código</label>
            <input type="text" value={codePrefix} onChange={e => setCodePrefix(e.target.value)} placeholder="Ej: P (se usará P1, P2, P3...)"
                   maxLength={3} className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Icono</label>
            <div className="grid grid-cols-10 gap-2">
              {ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110"
                        style={{ backgroundColor: icon === i ? 'var(--accent-light)' : 'var(--bg-tertiary)', border: icon === i ? '2px solid var(--accent)' : '2px solid transparent' }}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Color</label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                        className="w-12 h-12 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: c, border: color === c ? '3px solid white' : '3px solid transparent', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}>
                  {color === c && <Check size={20} color="white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 24px ${color}66` }}>
            <div className="text-4xl mb-2">{icon}</div>
            <div className="text-white font-bold text-lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{name || 'Nombre del himnario'}</div>
            <div className="text-white/70 text-xs" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{language}</div>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
            <button onClick={handleSave} disabled={!name.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Crear Himnario</button>
          </div>
        </div>
      </div>
    </div>
  );
}
