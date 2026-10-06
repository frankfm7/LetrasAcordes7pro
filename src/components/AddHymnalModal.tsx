import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotification } from './NotificationProvider';

const ICONS = ['🎵', '🎶', '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '⛪', '🏔️', '🌿', '✍️', '📖', '🕊️', '⭐', '🌟', '🎼', '🎯', '❤️', '🔥', '🌊', '🌙', '☀️', '🌈', '🦋', '🌺', '🍀', '🏆', '💎', '🎭'];
const COLORS = ['#a855f7', '#7c3aed', '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#8b5cf6'];
const DEFAULT_LANGUAGES = ['Castellano', 'Aymara', 'Quechua', 'Inglés', 'Portugués', 'Francés', 'Italiano', 'Alemán'];

interface AddHymnalModalProps {
  onClose: () => void;
}

export default function AddHymnalModal({ onClose }: AddHymnalModalProps) {
  const { addCustomHymnal } = useApp();
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Castellano']);
  const [icon, setIcon] = useState('🎵');
  const [color, setColor] = useState('#a855f7');
  const [codePrefix, setCodePrefix] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      showNotification('El nombre es obligatorio', 'error');
      return;
    }

    const prefix = codePrefix.trim() || name.trim().charAt(0).toUpperCase();
    
    const newHymnal = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      language: selectedLanguages.join('/'),
      icon,
      color,
      isCustom: true,
      codePrefix: prefix,
    };

    addCustomHymnal(newHymnal);
    showNotification('Cancionero creado exitosamente', 'success');
    onClose();
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl">Crear Nuevo Cancionero</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={20} /></button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Cancionero de Alabanza"
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} autoFocus />
          </div>

          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción breve del cancionero..."
                      className="w-full p-3 rounded-xl border text-sm resize-none" rows={2} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Idiomas</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_LANGUAGES.map(lang => (
                <button key={lang} onClick={() => toggleLanguage(lang)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: selectedLanguages.includes(lang) ? 'var(--accent)' : 'var(--bg-tertiary)',
                          color: selectedLanguages.includes(lang) ? 'white' : 'var(--text-primary)',
                          border: selectedLanguages.includes(lang) ? '2px solid var(--accent)' : '2px solid transparent'
                        }}>
                  {selectedLanguages.includes(lang) && <Check size={12} className="inline mr-1" />}
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Prefijo del Código</label>
            <input type="text" value={codePrefix} onChange={e => setCodePrefix(e.target.value.toUpperCase())} maxLength={3} placeholder="Ej: HA, AL, M"
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Se usará para identificar las canciones (ej: {codePrefix || name.charAt(0).toUpperCase() || 'X'}1, {codePrefix || name.charAt(0).toUpperCase() || 'X'}2...)</p>
          </div>

          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Icono</label>
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
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Color</label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                        className="w-10 h-10 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: c, border: color === c ? '3px solid white' : '3px solid transparent', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}>
                  {color === c && <Check size={18} color="white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
            <button onClick={handleSave} disabled={!name.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Crear Cancionero</button>
          </div>
        </div>
      </div>
    </div>
  );
}
