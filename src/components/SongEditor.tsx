import { useState } from 'react';
import { ChevronLeft, Save, Trash2, Plus, X } from 'lucide-react';
import { Song } from '../types';
import { useApp } from '../context/AppContext';
import { useNotification } from './NotificationProvider';
import { hymnals } from '../data/songs';
import { transposeLyrics } from '../utils/chords';

interface SongEditorProps {
  song: Song;
  onBack: () => void;
}

export default function SongEditor({ song, onBack }: SongEditorProps) {
  const { state, updateCustomSong, removeCustomSong } = useApp();
  const { showNotification } = useNotification();
  
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [key, setKey] = useState(song.key);
  const [timeSignature, setTimeSignature] = useState(song.timeSignature);
  const [bpm, setBpm] = useState(song.bpm);
  const [language, setLanguage] = useState(song.language.split('/')[0]);
  const [categories, setCategories] = useState<string[]>(song.categories);
  const [lyrics, setLyrics] = useState(song.lyrics);
  const [lyricsByLanguage, setLyricsByLanguage] = useState<Record<string, string>>(song.lyricsByLanguage || {});
  const [activeLanguageTab, setActiveLanguageTab] = useState<string>(song.language.split('/')[0]);
  const [notes, setNotes] = useState(song.notes);
  const [hymnalId, setHymnalId] = useState(song.hymnalId);
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState('');

  const originalKey = song.key;
  const allLanguages = [language, ...Object.keys(lyricsByLanguage).filter(l => l !== language)];

  const handleSave = () => {
    if (!title.trim()) {
      showNotification('El título es obligatorio', 'error');
      return;
    }

    let finalLyrics = lyrics;
    const finalLyricsByLanguage = { ...lyricsByLanguage };

    // Si hay múltiples idiomas, guardar la letra actual en el idioma activo
    if (allLanguages.length > 1) {
      finalLyricsByLanguage[activeLanguageTab] = lyrics;
      // Usar la letra del primer idioma como principal
      finalLyrics = lyricsByLanguage[language] || lyrics;
    }

    if (key !== originalKey) {
      const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const originalBase = originalKey.replace(/m$/, '');
      const newBase = key.replace(/m$/, '');
      const originalIndex = allNotes.indexOf(originalBase);
      const newIndex = allNotes.indexOf(newBase);

      if (originalIndex !== -1 && newIndex !== -1) {
        const semitones = newIndex - originalIndex;
        finalLyrics = transposeLyrics(finalLyrics, semitones);
        Object.keys(finalLyricsByLanguage).forEach(lang => {
          finalLyricsByLanguage[lang] = transposeLyrics(finalLyricsByLanguage[lang], semitones);
        });
      }
    }

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

  const handleAddLanguage = () => {
    if (!newLanguageName.trim()) {
      showNotification('El nombre del idioma es obligatorio', 'error');
      return;
    }
    if (allLanguages.includes(newLanguageName.trim())) {
      showNotification('Este idioma ya existe', 'error');
      return;
    }
    
    const updatedLyricsByLanguage = { ...lyricsByLanguage };
    // Guardar la letra actual antes de cambiar
    updatedLyricsByLanguage[activeLanguageTab] = lyrics;
    // Agregar el nuevo idioma con letra vacía
    updatedLyricsByLanguage[newLanguageName.trim()] = '';
    
    setLyricsByLanguage(updatedLyricsByLanguage);
    setActiveLanguageTab(newLanguageName.trim());
    setLyrics('');
    setNewLanguageName('');
    setShowAddLanguageModal(false);
    showNotification('Idioma agregado', 'success');
  };

  const handleLanguageTabChange = (lang: string) => {
    // Guardar la letra actual antes de cambiar
    const updatedLyricsByLanguage = { ...lyricsByLanguage };
    updatedLyricsByLanguage[activeLanguageTab] = lyrics;
    setLyricsByLanguage(updatedLyricsByLanguage);
    
    // Cambiar al nuevo idioma
    setActiveLanguageTab(lang);
    setLyrics(updatedLyricsByLanguage[lang] || '');
  };

  const handleRemoveLanguage = (lang: string) => {
    if (lang === language) {
      showNotification('No puedes eliminar el idioma principal', 'error');
      return;
    }
    if (confirm(`¿Eliminar el idioma "${lang}"?`)) {
      const updatedLyricsByLanguage = { ...lyricsByLanguage };
      delete updatedLyricsByLanguage[lang];
      setLyricsByLanguage(updatedLyricsByLanguage);
      setActiveLanguageTab(language);
      setLyrics(updatedLyricsByLanguage[language] || lyrics);
      showNotification('Idioma eliminado', 'success');
    }
  };

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar "${title}"? Esta acción no se puede deshacer.`)) {
      removeCustomSong(song.id);
      showNotification('Canción eliminada', 'success');
      onBack();
    }
  };

  // Combinar himnarios evitando duplicados
  const customIds = new Set(state.customHymnals.map(h => h.id));
  const defaultNotEdited = hymnals.filter(h => !customIds.has(h.id));
  const allHymnals = [...defaultNotEdited, ...state.customHymnals];

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Editar Canción</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{song.code}</p>
        </div>
        <button onClick={handleDelete} className="p-2 rounded-xl text-red-500" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <Trash2 size={20} />
        </button>
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
            {allHymnals.map(h => (
              <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Idioma Principal</label>
          <div className="flex gap-2">
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="flex-1 p-3 rounded-xl border text-sm" 
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="Castellano">Castellano</option>
              <option value="Aymara">Aymara</option>
              <option value="Quechua">Quechua</option>
              <option value="Inglés">Inglés</option>
              <option value="Otro">Otro (especificar abajo)</option>
            </select>
            <button
              onClick={() => setShowAddLanguageModal(true)}
              className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Agregar idioma</span>
            </button>
          </div>
          {language === 'Otro' && (
            <input 
              type="text" 
              placeholder="Especificar idioma..."
              className="w-full p-3 rounded-xl border text-sm mt-2" 
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onBlur={e => {
                if (e.target.value.trim()) {
                  setLanguage(e.target.value.trim());
                }
              }}
            />
          )}
        </div>

        <div>
          <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Letra y Acordes</label>
          
          {/* Pestañas de idiomas si hay múltiples */}
          {allLanguages.length > 1 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {allLanguages.map(lang => (
                <div key={lang} className="flex items-center gap-1">
                  <button
                    onClick={() => handleLanguageTabChange(lang)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      backgroundColor: activeLanguageTab === lang ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: activeLanguageTab === lang ? 'white' : 'var(--text-primary)',
                      border: activeLanguageTab === lang ? '2px solid var(--accent)' : '2px solid transparent'
                    }}
                  >
                    {lang}
                  </button>
                  {lang !== language && (
                    <button
                      onClick={() => handleRemoveLanguage(lang)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                      title="Eliminar idioma"
                    >
                      <X size={12} className="text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <textarea
            value={lyrics}
            onChange={e => setLyrics(e.target.value)}
            rows={15}
            className="w-full p-3 rounded-xl border text-sm font-mono"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            placeholder={`VERSO 1\n//G            Em          C          D\nLetra de la canción\n//G            Em          C          D\ncon acordes arriba`}
          />
          {allLanguages.length > 1 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Editando: <strong>{activeLanguageTab}</strong> {activeLanguageTab === language && '(Idioma principal)'}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notas adicionales</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>

        <button onClick={handleSave} disabled={!title.trim()} className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
          <Save size={16} /> Guardar Cambios
        </button>
      </div>

      {/* Modal para agregar nuevo idioma */}
      {showAddLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAddLanguageModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Agregar Idioma</h3>
            <div>
              <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nombre del idioma</label>
              <input
                type="text"
                value={newLanguageName}
                onChange={e => setNewLanguageName(e.target.value)}
                placeholder="Ej: Francés, Portugués, etc."
                className="w-full p-3 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddLanguageModal(false);
                  setNewLanguageName('');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddLanguage}
                disabled={!newLanguageName.trim()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
