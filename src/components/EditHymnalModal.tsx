import { useState } from 'react';
import { Hymnal } from '../types';
import { X, Save } from 'lucide-react';

const ICONS = ['🎵', '🎶', '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '⛪', '🏔️', '🌿', '✍️', '📖', '🕊️', '⭐', '🌟', '🎼', '🎯', '❤️', '🔥'];
const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#22c55e', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#6366f1', '#14b8a6'];

export default function EditHymnalModal({ hymnal, onClose, onSave }: { hymnal: Hymnal; onClose: () => void; onSave: (hymnal: Hymnal) => void }) {
  const [name, setName] = useState(hymnal.name);
  const [description, setDescription] = useState(hymnal.description);
  const [language, setLanguage] = useState(hymnal.language);
  const [icon, setIcon] = useState(hymnal.icon);
  const [color, setColor] = useState(hymnal.color);
  const [codePrefix, setCodePrefix] = useState(hymnal.codePrefix || '');

  const handleSave = () => {
    if (!name.trim()) return;
    const updatedHymnal: Hymnal = {
      ...hymnal,
      name: name.trim(),
      description: description.trim(),
      language,
      icon,
      color,
      codePrefix: codePrefix.trim() || hymnal.id.charAt(0).toUpperCase(),
    };
    onSave(updatedHymnal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Editar Himnario</h3>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Descripción</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Idioma</label>
            <input type="text" value={language} onChange={e => setLanguage(e.target.value)}
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Prefijo de Código</label>
            <input type="text" value={codePrefix} onChange={e => setCodePrefix(e.target.value)} maxLength={3}
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>⚠️ Cambiar el prefijo actualizará los códigos de todas las canciones</p>
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
                        style={{ backgroundColor: c, border: color === c ? '3px solid white' : '3px solid transparent' }}>
                  {color === c && <Save size={20} color="white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
            <button onClick={handleSave} disabled={!name.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              <Save size={16} /> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
