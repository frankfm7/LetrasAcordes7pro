import { useState, useMemo } from 'react';
import { Hymnal } from '../types';
import { X, Check, Image, Trash2, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotification } from './NotificationProvider';
import { hymnals } from '../data/songs';

const ICONS = ['🎵', '🎶', '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '⛪', '🏔️', '🌿', '✍️', '📖', '🕊️', '⭐', '🌟', '🎼', '🎯', '❤️', '🔥', '🌊', '🌙', '☀️', '🌈', '🦋', '🌺', '🍀', '🎯', '🏆', '💎'];
const COLORS = ['#a855f7', '#7c3aed', '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#8b5cf6'];
const DEFAULT_LANGUAGES = ['Castellano', 'Aymara', 'Quechua', 'Inglés', 'Portugués', 'Francés', 'Italiano', 'Alemán'];

interface EditHymnalModalProps {
  hymnal: Hymnal;
  onClose: () => void;
  onSave: (hymnal: Hymnal) => void;
}

export default function EditHymnalModal({ hymnal, onClose, onSave }: EditHymnalModalProps) {
  const { state, updateCustomSong } = useApp();
  const { showNotification } = useNotification();
  const [name, setName] = useState(hymnal.name);
  const [description, setDescription] = useState(hymnal.description);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(hymnal.language.split('/'));
  const [icon, setIcon] = useState(hymnal.icon);
  const [color, setColor] = useState(hymnal.color);
  const [codePrefix, setCodePrefix] = useState(hymnal.codePrefix || '');
  const [coverImage, setCoverImage] = useState<string | null>(hymnal.image || null);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState('');
  const [customLanguages, setCustomLanguages] = useState<string[]>([]);

  const allLanguages = [...DEFAULT_LANGUAGES, ...customLanguages];

  // Obtener todos los prefijos usados por otros cancioneros
  const usedPrefixes = useMemo(() => {
    const allHymnals = [...hymnals, ...state.customHymnals];
    return allHymnals
      .filter(h => h.id !== hymnal.id)
      .map(h => h.codePrefix || h.id.charAt(0).toUpperCase());
  }, [hymnal.id, state.customHymnals]);

  // Verificar si el prefijo actual está en uso
  const isPrefixInUse = useMemo(() => {
    const prefix = codePrefix.trim() || hymnal.id.charAt(0).toUpperCase();
    return usedPrefixes.includes(prefix);
  }, [codePrefix, hymnal.id, usedPrefixes]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
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

  const handleAddCustomLanguage = () => {
    if (newLanguageName.trim() && !allLanguages.includes(newLanguageName.trim())) {
      setCustomLanguages([...customLanguages, newLanguageName.trim()]);
      setSelectedLanguages([...selectedLanguages, newLanguageName.trim()]);
      setNewLanguageName('');
      setShowAddLanguage(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    const prefix = codePrefix.trim() || hymnal.id.charAt(0).toUpperCase();
    const oldPrefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
    
    // Validar que el prefijo no esté en uso por otro cancionero (solo si cambió)
    if (prefix !== oldPrefix && isPrefixInUse) {
      showNotification('Prefijo ya usado por otro cancionero. Seleccione otro prefijo.', 'error');
      return;
    }
    
    // Si el prefijo cambió, actualizar los códigos de las canciones asociadas
    if (prefix !== oldPrefix) {
      // Obtener todas las canciones del cancionero (incluyendo las predeterminadas)
      const allHymnalSongs = [...state.customSongs.filter(s => s.hymnalId === hymnal.id)];
      
      // Actualizar las canciones customSongs
      allHymnalSongs.forEach(song => {
        // Extraer el número del código antiguo
        const numberMatch = song.code.match(/(\d+)$/);
        const number = numberMatch ? numberMatch[1] : '1';
        const newCode = `${prefix}${number}`;
        
        // Actualizar la canción con el nuevo código
        updateCustomSong({ ...song, code: newCode });
      });
      
      showNotification(`Prefijo actualizado de ${oldPrefix} a ${prefix}`, 'success');
    }
    
    const updatedHymnal: Hymnal = {
      ...hymnal,
      name: name.trim(),
      description: description.trim(),
      language: selectedLanguages.join('/'),
      icon,
      color,
      codePrefix: prefix,
      image: coverImage || undefined,
    };
    onSave(updatedHymnal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl">Editar Cancionero</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={20} /></button>
        </div>

        <div className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Cancionero de Alabanza"
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} autoFocus />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción breve del cancionero..."
                      className="w-full p-3 rounded-xl border text-sm resize-none" rows={2} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          {/* Idiomas */}
          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Idiomas</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedLanguages.map(lang => (
                <div key={lang} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                  <span>{lang}</span>
                  {selectedLanguages.length > 1 && (
                    <button onClick={() => setSelectedLanguages(selectedLanguages.filter(l => l !== lang))} className="ml-1 hover:opacity-70">×</button>
                  )}
                </div>
              ))}
            </div>
            <div className="relative">
              <select
                onChange={e => {
                  if (e.target.value === '__add_new__') {
                    setShowAddLanguage(true);
                  } else if (e.target.value && !selectedLanguages.includes(e.target.value)) {
                    toggleLanguage(e.target.value);
                  }
                  e.target.value = '';
                }}
                className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="">+ Agregar idioma...</option>
                {allLanguages.filter(l => !selectedLanguages.includes(l)).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
                <option value="__add_new__">✨ Agregar nuevo idioma</option>
              </select>
            </div>
            {showAddLanguage && (
              <div className="mt-2 flex gap-2">
                <input type="text" value={newLanguageName} onChange={e => setNewLanguageName(e.target.value)} placeholder="Nombre del idioma" className="flex-1 p-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} autoFocus />
                <button onClick={handleAddCustomLanguage} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Agregar</button>
                <button onClick={() => { setShowAddLanguage(false); setNewLanguageName(''); }} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-tertiary)' }}>×</button>
              </div>
            )}
          </div>

          {/* Prefijo del Código */}
          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Prefijo del Código</label>
            <input 
              type="text" 
              value={codePrefix} 
              onChange={e => setCodePrefix(e.target.value.toUpperCase())} 
              maxLength={3} 
              placeholder="Ej: HA, AL, M"
              className="w-full p-3 rounded-xl border text-sm" 
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: isPrefixInUse ? '#ef4444' : 'var(--border-color)', 
                color: 'var(--text-primary)' 
              }} 
            />
            {isPrefixInUse && (
              <p className="text-xs mt-1 font-semibold" style={{ color: '#ef4444' }}>⚠️ Prefijo ya usado por otro cancionero. Seleccione otro prefijo.</p>
            )}
            {!isPrefixInUse && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Se usará para identificar las canciones (ej: {codePrefix || name.charAt(0).toUpperCase() || 'X'}1, {codePrefix || name.charAt(0).toUpperCase() || 'X'}2...)</p>
            )}
          </div>

          {/* Iconos */}
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

          {/* Colores */}
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

          {/* Vista Previa con Imagen */}
          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Vista Previa</label>
            <div className="flex gap-4">
              <div className="rounded-xl p-5 relative overflow-hidden flex-shrink-0" style={{
                background: coverImage
                  ? `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${coverImage}) center/cover`
                  : `linear-gradient(135deg, ${color}, ${color}cc)`,
                boxShadow: `0 8px 24px ${color}44`,
                aspectRatio: '3/4',
                width: '150px',
              }}>
                <div className="text-4xl mb-2">{icon}</div>
                <div className="text-white font-bold text-base leading-tight mb-1" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}>{name || 'Nombre del cancionero'}</div>
                <div className="text-white/80 text-xs" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{selectedLanguages.join('/')}</div>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2">
                {coverImage ? (
                  <>
                    <button onClick={() => setCoverImage(null)} className="px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      🗑️ Eliminar imagen
                    </button>
                    <label className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      📷 Cambiar imagen
                    </label>
                  </>
                ) : (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <div className="rounded-xl border-2 border-dashed p-4 text-center transition-all hover:border-opacity-70" style={{ borderColor: 'var(--border-color)' }}>
                      <Image size={20} className="mx-auto mb-1" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-xs font-medium">Subir imagen de portada</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
            <button onClick={handleSave} disabled={!name.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              <Save size={16} /> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
