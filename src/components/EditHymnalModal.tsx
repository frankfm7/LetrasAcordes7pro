import { useState } from 'react';
import { Hymnal } from '../types';
import { X, Check, Image, Trash2 } from 'lucide-react';

const ICONS = ['🎵', '🎶', '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '⛪', '🏔️', '🌿', '✍️', '📖', '🕊️', '⭐', '🌟', '🎼', '🎯', '❤️', '🔥'];
const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#22c55e', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#6366f1', '#14b8a6'];
const LANGUAGES = ['Castellano', 'Aymara', 'Quechua', 'Inglés', 'Portugués', 'Francés', 'Italiano', 'Alemán'];

export default function EditHymnalModal({ hymnal, onClose, onSave }: { hymnal: Hymnal; onClose: () => void; onSave: (hymnal: Hymnal) => void }) {
  const [name, setName] = useState(hymnal.name);
  const [description, setDescription] = useState(hymnal.description);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(hymnal.language.split('/'));
  const [icon, setIcon] = useState(hymnal.icon);
  const [color, setColor] = useState(hymnal.color);
  const [codePrefix, setCodePrefix] = useState(hymnal.codePrefix || '');
  const [coverImage, setCoverImage] = useState<string | null>(hymnal.image || null);

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

  const handleSave = () => {
    if (!name.trim()) return;
    const prefix = codePrefix.trim() || hymnal.id.charAt(0).toUpperCase();
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
      <div className="w-full max-w-md rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Editar Cancionero</h3>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Imagen de Portada</label>
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <img src={coverImage} alt="Portada" className="w-full h-full object-cover" />
                <button onClick={() => setCoverImage(null)} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
                  <Trash2 size={16} />
                </button>
                <label className="absolute bottom-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Image size={16} />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="rounded-xl border-2 border-dashed p-6 text-center transition-all hover:border-opacity-70" style={{ borderColor: 'var(--border-color)', aspectRatio: '3/4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Image size={40} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm font-medium">Click para subir imagen</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Se usará como fondo al entrar</p>
                </div>
              </label>
            )}
          </div>

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
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Idiomas (selección múltiple)</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
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
                        style={{ backgroundColor: c, border: color === c ? '3px solid white' : '3px solid transparent', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}>
                  {color === c && <Check size={20} color="white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ 
            background: coverImage 
              ? `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${coverImage}) center/cover`
              : `linear-gradient(135deg, ${color}, ${color}cc)`, 
            boxShadow: `0 8px 24px ${color}66` 
          }}>
            <div className="text-4xl mb-2">{icon}</div>
            <div className="text-white font-bold text-lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{name || 'Nombre del cancionero'}</div>
            <div className="text-white/70 text-xs" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{selectedLanguages.join('/')}</div>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
            <button onClick={handleSave} disabled={!name.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
}
