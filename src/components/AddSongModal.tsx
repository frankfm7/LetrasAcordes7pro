import { useState, useMemo } from 'react';
import { Song, Hymnal } from '../types';
import { songs as allSongs } from '../data/songs';
import { useApp } from '../context/AppContext';
import { generateSongCode, getNextSongNumber } from '../data/songCode';
import { X, Save } from 'lucide-react';

export default function AddSongModal({ hymnal, onClose }: { hymnal: Hymnal; onClose: () => void }) {
  const { state, addCustomSong } = useApp();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('C');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [bpm, setBpm] = useState(100);
  const [language, setLanguage] = useState(hymnal.language.split('/')[0]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [lyrics, setLyrics] = useState('INTRO\n//Am  F  Em  Am\n\nVERSO 1\n//Am           F             Em       Am\nEscribe aquí la letra de la canción\n//Am           F             Em       Am\ncon los acordes alineados arriba\n\nCORO\n//F              G           Am\nLa letra del coro va aquí\n//F              G           Am\ncon acordes en la línea de arriba');
  const [notes, setNotes] = useState('');

  const allAvailableSongs = useMemo(() => {
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);

  const nextNumber = getNextSongNumber(hymnal.id, allAvailableSongs);
  const code = generateSongCode(hymnal, nextNumber);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    allAvailableSongs.forEach(s => s.categories.forEach(c => cats.add(c)));
    return Array.from(cats).sort();
  }, [allAvailableSongs]);

  const handleSave = () => {
    if (!title.trim()) return;
    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim() || 'Desconocido',
      code,
      number: nextNumber,
      hymnalId: hymnal.id,
      key,
      timeSignature,
      bpm,
      language,
      categories: categories.length > 0 ? categories : ['General'],
      sections: [],
      lyrics,
      notes,
    };
    addCustomSong(newSong);
    onClose();
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">Nueva Canción</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hymnal.name} • Código: {code}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Título *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título de la canción"
                     className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Artista</label>
              <input type="text" value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artista o autor"
                     className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tonalidad</label>
              <select value={key} onChange={e => setKey(e.target.value)}
                      className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Compás</label>
              <select value={timeSignature} onChange={e => setTimeSignature(e.target.value)}
                      className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option>4/4</option><option>3/4</option><option>6/8</option><option>2/4</option><option>2/2</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>BPM</label>
              <input type="number" value={bpm} onChange={e => setBpm(Number(e.target.value))} min="40" max="240"
                     className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Idioma</label>
            <input type="text" value={language} onChange={e => setLanguage(e.target.value)}
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Categorías</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map(cat => (
                <span key={cat} className="px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                  {cat}
                  <button onClick={() => removeCategory(cat)} className="hover:opacity-70"><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nueva categoría"
                     className="flex-1 p-2 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                     onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())} />
              <button onClick={addCategory} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Agregar</button>
            </div>
            {allCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {allCategories.filter(c => !categories.includes(c)).slice(0, 10).map(cat => (
                  <button key={cat} onClick={() => setCategories([...categories, cat])}
                          className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    + {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Letra y Acordes</label>
            <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={12}
                      className="w-full p-3 rounded-xl border text-sm font-mono" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="Usa // antes de los acordes&#10;Ejemplo:&#10;VERSO 1&#10;//Am           F             Em       Am&#10;Letra de la canción aquí" />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              💡 Tip: Usa VERSO, CORO, PUENTE, INTRO, FINAL como encabezados de sección
            </p>
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notas adicionales</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="Notas personales sobre la canción" />
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
            <button onClick={handleSave} disabled={!title.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              <Save size={16} /> Guardar Canción
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
