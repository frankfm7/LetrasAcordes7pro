import { useState, useMemo } from 'react';
import { Song } from '../types';
import { useApp } from '../context/AppContext';
import { useNotification } from './NotificationProvider';
import { hymnals } from '../data/songs';
import { transposeLyrics } from '../utils/chords';
import { ChevronLeft, Save, Trash2, Plus, X } from 'lucide-react';

export default function SongEditor({ song, onBack }: { song: Song; onBack: () => void }) {
  const { state, updateCustomSong, removeCustomSong } = useApp();
  const { showNotification } = useNotification();
  const isNewSong = song.id.startsWith('new-');
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [key, setKey] = useState(song.key);
  const [timeSignature, setTimeSignature] = useState(song.timeSignature);
  const [bpm, setBpm] = useState(song.bpm);
  const [language, setLanguage] = useState(song.language);
  const [categories, setCategories] = useState<string[]>(song.categories);
  const [newCategory, setNewCategory] = useState('');
  const [lyrics, setLyrics] = useState(song.lyrics);
  const [lyricsByLanguage, setLyricsByLanguage] = useState<Record<string, string>>(song.lyricsByLanguage || {});
  const [activeLanguageTab, setActiveLanguageTab] = useState(language);
  const [notes, setNotes] = useState(song.notes);
  const [hymnalId, setHymnalId] = useState(song.hymnalId);
  const [originalKey] = useState(song.key);

  const handleSave = () => {
    if (!title.trim()) {
      showNotification('El título es obligatorio', 'error');
      return;
    }

    let finalLyrics = lyrics;
    const finalLyricsByLanguage = { ...lyricsByLanguage };

    if (key !== originalKey) {
      const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const originalBase = originalKey.replace(/m$/, '');
      const newBase = key.replace(/m$/, '');
      const originalIndex = allNotes.indexOf(originalBase);
      const newIndex = allNotes.indexOf(newBase);

      if (originalIndex !== -1 && newIndex !== -1) {
        const semitones = newIndex - originalIndex;
        finalLyrics = transposeLyrics(lyrics, semitones);
        Object.keys(finalLyricsByLanguage).forEach(lang => {
          finalLyricsByLanguage[lang] = transposeLyrics(finalLyricsByLanguage[lang], semitones);
        });
      }
    }

    const allLanguages = [language, ...Object.keys(finalLyricsByLanguage).filter(l => l !== language)];
    const languageString = allLanguages.length > 1 ? allLanguages.join('/') : language;

    const updatedSong: Song = {
      ...song,
      title: title.trim(),
      artist: artist.trim() || 'Desconocido',
      key,
      timeSignature,
      bpm,
      language: languageString,
      categories,
      lyrics: finalLyrics,
      lyricsByLanguage: Object.keys(finalLyricsByLanguage).length > 0 ? finalLyricsByLanguage : undefined,
      notes,
      hymnalId,
    };
    updateCustomSong(updatedSong);
    showNotification('Canción guardada', 'success');
    onBack();
  };

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar "${title}"? Esta acción no se puede deshacer.`)) {
      removeCustomSong(song.id);
      showNotification('Canción eliminada', 'success');
      onBack();
    }
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

  const addLanguage = () => {
    const newLang = prompt('Ingresa el nombre del nuevo idioma:');
    if (newLang && newLang.trim()) {
      const trimmedLang = newLang.trim();
      if (!lyricsByLanguage[trimmedLang]) {
        setLyricsByLanguage({ ...lyricsByLanguage, [trimmedLang]: '' });
      }
    }
  };

  const removeLanguage = (lang: string) => {
    if (lang === language) {
      alert('No puedes eliminar el idioma principal');
      return;
    }
    const newLyricsByLanguage = { ...lyricsByLanguage };
    delete newLyricsByLanguage[lang];
    setLyricsByLanguage(newLyricsByLanguage);
    if (activeLanguageTab === lang) {
      setActiveLanguageTab(language);
    }
  };

  const handleLyricsChange = (lang: string, value: string) => {
    if (lang === language) {
      setLyrics(value);
    } else {
      setLyricsByLanguage({ ...lyricsByLanguage, [lang]: value });
    }
  };

  const getCurrentLyrics = () => {
    if (activeLanguageTab === language) {
      return lyrics;
    }
    return lyricsByLanguage[activeLanguageTab] || '';
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{isNewSong ? 'Nueva Canción' : 'Editar Canción'}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{song.code}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Título *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Artista</label>
            <input type="text" value={artist} onChange={e => setArtist(e.target.value)}
                   className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tonalidad</label>
            <select value={key} onChange={e => setKey(e.target.value)}
                    className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'A#m'].map(k => (
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
          <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Cancionero</label>
          <select value={hymnalId} onChange={e => setHymnalId(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            {[...hymnals, ...state.customHymnals].map(h => (
              <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Idioma Principal</label>
            <button onClick={addLanguage} className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              <Plus size={14} /> Agregar idioma
            </button>
          </div>
          <input type="text" value={language} onChange={e => setLanguage(e.target.value)}
                 className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>

        <div>
          <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Categorías</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map(cat => (
              <span key={cat} className="px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                {cat}
                <button onClick={() => removeCategory(cat)} className="hover:opacity-70">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nueva categoría"
                   className="flex-1 p-2 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                   onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())} />
            <button onClick={addCategory} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Agregar</button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Letra y Acordes</label>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setActiveLanguageTab(language)}
              className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              style={{
                backgroundColor: activeLanguageTab === language ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: activeLanguageTab === language ? 'white' : 'var(--text-primary)',
              }}
            >
              {language} (Principal)
            </button>

            {Object.keys(lyricsByLanguage).map(lang => (
              <button
                key={lang}
                onClick={() => setActiveLanguageTab(lang)}
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: activeLanguageTab === lang ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: activeLanguageTab === lang ? 'white' : 'var(--text-primary)',
                }}
              >
                {lang}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLanguage(lang);
                  }}
                  className="hover:opacity-70"
                >
                  <X size={14} />
                </button>
              </button>
            ))}
          </div>

          <textarea
            value={getCurrentLyrics()}
            onChange={e => handleLyricsChange(activeLanguageTab, e.target.value)}
            rows={15}
            className="w-full p-3 rounded-xl border text-sm font-mono"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            placeholder={`Escribe la letra y acordes en ${activeLanguageTab}...`}
          />

          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            💡 Editando: <strong>{activeLanguageTab}</strong> {activeLanguageTab === language && '(Idioma principal)'}
          </p>
        </div>

        <div>
          <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notas adicionales</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>

        <button onClick={handleSave} disabled={!title.trim()} className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
          <Save size={16} /> {isNewSong ? 'Crear Canción' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
