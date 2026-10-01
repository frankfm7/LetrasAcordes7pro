import { useState, useMemo } from 'react';
import { X, Download, Upload, FileText, File, Search, CheckSquare, Square, Camera, Save, Edit3, Plus } from 'lucide-react';
import { Song } from '../types';
import { songs as allSongs, hymnals } from '../data/songs';
import { useApp } from '../context/AppContext';
import { generateSongCode, getNextSongNumber } from '../data/songCode';

interface ExportImportModalProps {
  onClose: () => void;
  mode: 'export' | 'import';
  showNotification: (msg: string, type?: string) => void;
}

export default function ExportImportModal({ onClose, mode, showNotification }: ExportImportModalProps) {
  const { state, addCustomSong, addMultipleCustomSongs } = useApp();
  
  // Estados de exportación
  const [exportStep, setExportStep] = useState<'choice' | 'select' | 'format'>('choice');
  const [exportType, setExportType] = useState<'single' | 'batch'>('single');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados de importación
  const [importStep, setImportStep] = useState<'choice' | 'analyze' | 'select-hymnal' | 'edit' | 'select-hymnal-for-save'>('choice');
  const [parsedSongs, setParsedSongs] = useState<any[]>([]);
  const [selectedHymnalId, setSelectedHymnalId] = useState<string>('mis-canciones');
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLyrics, setEditLyrics] = useState('');

  // CORRECCIÓN 1: Evitar duplicación de canciones
  const allAvailableSongs = useMemo(() => {
    // Crear un mapa de canciones personalizadas por ID
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));
    
    // Combinar canciones predefinidas con personalizadas, evitando duplicados
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);
    
    // Agregar canciones personalizadas que no están en las predefinidas
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));
    
    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return allAvailableSongs;
    const q = searchQuery.toLowerCase();
    return allAvailableSongs.filter(song =>
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.code.toLowerCase().includes(q) ||
      song.lyrics.toLowerCase().includes(q)
    );
  }, [searchQuery, allAvailableSongs]);

  // CORRECCIÓN 2: Usar prefijo correcto del cancionero
  const parseMultipleSongs = (text: string): any[] => {
    const songs: any[] = [];
    
    // Dividir por líneas de separación (3 o más signos =)
    const songBlocks = text.split(/\n\s*={3,}\s*\n/);
    
    songBlocks.forEach((block) => {
      if (!block.trim()) return;
      
      // Extraer título inteligente
      const title = extractTitle(block);
      
      // Extraer metadata
      const artistMatch = block.match(/Artista:\s*(.+)/i);
      const keyMatch = block.match(/Tonalidad:\s*(.+)/i);
      const timeSigMatch = block.match(/Compás:\s*(.+)/i);
      const bpmMatch = block.match(/BPM:\s*(.+)/i);
      const langMatch = block.match(/Idioma:\s*(.+)/i);
      const catMatch = block.match(/Categorías:\s*(.+)/i);
      
      // Extraer letra (después de ---)
      const lyricsStart = block.indexOf('---');
      const lyrics = lyricsStart !== -1 ? block.substring(lyricsStart + 3).trim() : block.trim();
      
      if (title && title !== 'Sin título') {
        songs.push({
          title,
          artist: artistMatch ? artistMatch[1].trim() : 'Desconocido',
          key: keyMatch ? keyMatch[1].trim() : 'C',
          timeSignature: timeSigMatch ? timeSigMatch[1].trim() : '4/4',
          bpm: bpmMatch ? parseInt(bpmMatch[1].trim()) : 100,
          language: langMatch ? langMatch[1].trim() : 'Castellano',
          categories: catMatch ? catMatch[1].split(',').map(c => c.trim()) : ['General'],
          lyrics,
        });
      }
    });
    
    return songs;
  };

  const extractTitle = (text: string): string => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'Sin título';
    
    const firstLine = lines[0].trim();
    const isChords = /^\/\/[A-G]/.test(firstLine) || /^[A-G][#b]?\s+[A-G]/.test(firstLine);
    
    if (isChords && lines.length > 1) {
      return lines[1].trim();
    }
    
    for (const line of lines.slice(0, 5)) {
      const titleMatch = line.match(/(?:Título|Title|Nombre):\s*(.+)/i);
      if (titleMatch) return titleMatch[1].trim();
    }
    
    return firstLine;
  };

  // CORRECCIÓN 2: Guardar canciones con prefijo correcto
  const saveParsedSongs = () => {
    const selectedHymnal = [...hymnals, ...state.customHymnals].find(h => h.id === selectedHymnalId);
    if (!selectedHymnal) {
      showNotification('Cancionero no encontrado', 'error');
      return;
    }
    
    // CORRECCIÓN 1: Usar solo canciones personalizadas para calcular el siguiente número
    const allCustomSongs = state.customSongs;
    let currentNumber = getNextSongNumber(selectedHymnalId, allCustomSongs);
    
    const timestamp = Date.now();
    const newSongs: Song[] = parsedSongs.map((song, index) => {
      // CORRECCIÓN 2: Generar código con prefijo del cancionero
      const code = generateSongCode(selectedHymnal, currentNumber + index);
      return {
        id: `custom-${timestamp}-${index}`,
        title: song.title,
        artist: song.artist,
        code,
        number: currentNumber + index,
        hymnalId: selectedHymnalId,
        key: song.key,
        timeSignature: song.timeSignature,
        bpm: song.bpm,
        language: song.language,
        categories: song.categories,
        sections: [],
        lyrics: song.lyrics,
        notes: 'Importado desde archivo',
      };
    });
    
    addMultipleCustomSongs(newSongs);
    showNotification(`${parsedSongs.length} canciones importadas`, 'success');
    onClose();
  };

  const saveEditedSongWithHymnal = () => {
    if (editingSongIndex === null) return;
    
    const song = parsedSongs[editingSongIndex];
    const selectedHymnal = [...hymnals, ...state.customHymnals].find(h => h.id === selectedHymnalId);
    if (!selectedHymnal) {
      showNotification('Cancionero no encontrado', 'error');
      return;
    }
    
    // CORRECCIÓN 1: Usar solo canciones personalizadas
    const allCustomSongs = state.customSongs;
    const nextNumber = getNextSongNumber(selectedHymnalId, allCustomSongs);
    
    // CORRECCIÓN 2: Generar código con prefijo del cancionero
    const code = generateSongCode(selectedHymnal, nextNumber);
    
    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: editTitle,
      artist: song.artist,
      code,
      number: nextNumber,
      hymnalId: selectedHymnalId,
      key: song.key,
      timeSignature: song.timeSignature,
      bpm: song.bpm,
      language: song.language,
      categories: song.categories,
      sections: [],
      lyrics: editLyrics,
      notes: 'Importado desde archivo',
    };
    
    addCustomSong(newSong);
    
    const updatedSongs = parsedSongs.filter((_, index) => index !== editingSongIndex);
    setParsedSongs(updatedSongs);
    
    showNotification('Canción guardada en cancionero', 'success');
    
    if (updatedSongs.length > 0) {
      setImportStep('select-hymnal');
    } else {
      showNotification('Todas las canciones han sido guardadas', 'success');
      onClose();
    }
  };

  const handleFileImport = async (file: File) => {
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let text = '';
      
      if (extension === 'txt') {
        text = await file.text();
      } else {
        showNotification('Formato no soportado', 'error');
        return;
      }
      
      const songs = parseMultipleSongs(text);
      
      if (songs.length === 0) {
        showNotification('No se encontraron canciones en el archivo', 'error');
        return;
      }
      
      setParsedSongs(songs);
      
      if (songs.length === 1) {
        setEditingSongIndex(0);
        setEditTitle(songs[0].title);
        setEditLyrics(songs[0].lyrics);
        setImportStep('edit');
      } else {
        setImportStep('select-hymnal');
      }
    } catch (error) {
      console.error('Error importing:', error);
      showNotification('Error al importar', 'error');
    }
  };

  // Renderizado del modal
  if (mode === 'import') {
    if (importStep === 'choice') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={onClose} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600" style={{ color: 'white' }}>‹</button>
              <h3 className="text-xl font-bold flex-1 text-center">Importar Canciones</h3>
              <div style={{ width: '48px' }}></div>
            </div>
            
            <div className="space-y-3">
              <label className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all cursor-pointer block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <input type="file" accept=".txt" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])} className="hidden" />
                <div className="flex items-center gap-3">
                  <FileText size={32} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div className="font-bold">Texto (.txt)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde archivo de texto</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (importStep === 'select-hymnal') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={onClose} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600" style={{ color: 'white' }}>‹</button>
              <h3 className="text-xl font-bold flex-1 text-center">Canciones Detectadas ({parsedSongs.length})</h3>
              <div style={{ width: '48px' }}></div>
            </div>
            
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)' }}>
              <p className="text-sm font-semibold mb-2">📍 ¿Dónde guardar las canciones?</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Se detectaron {parsedSongs.length} canciones. Elige un cancionero existente o crea uno nuevo.
              </p>
            </div>
            
            <div className="space-y-2 mb-4">
              <label className="text-xs font-bold mb-1.5 block">Seleccionar Cancionero</label>
              <div className="flex gap-2">
                <select
                  value={selectedHymnalId}
                  onChange={e => setSelectedHymnalId(e.target.value)}
                  className="flex-1 p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {[...hymnals, ...state.customHymnals].map(h => (
                    <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {parsedSongs.map((song, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{song.title}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {song.artist} • {song.key} • {song.language}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingSongIndex(index);
                        setEditTitle(song.title);
                        setEditLyrics(song.lyrics);
                        setImportStep('edit');
                      }}
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      title="Editar esta canción"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setImportStep('choice')}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                ‹ Cancelar
              </button>
              <button
                onClick={saveParsedSongs}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                <Save size={18} /> Guardar {parsedSongs.length} Canciones
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (importStep === 'edit' && editingSongIndex !== null) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-3xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  if (parsedSongs.length > 1) {
                    setImportStep('select-hymnal');
                  } else {
                    setImportStep('choice');
                  }
                }}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
                style={{ color: 'white' }}
              >
                ‹
              </button>
              <h3 className="text-xl font-bold flex-1 text-center">Editar Canción</h3>
              <div style={{ width: '48px' }}></div>
            </div>
            
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)' }}>
              <p className="text-sm font-semibold mb-2">📍 ¿Dónde se guardará?</p>
              <select
                value={selectedHymnalId}
                onChange={e => setSelectedHymnalId(e.target.value)}
                className="w-full p-2 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {[...hymnals, ...state.customHymnals].map(h => (
                  <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1.5 block">Título *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Título de la canción"
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              
              <div>
                <label className="text-xs font-bold mb-1.5 block">Letra y Acordes</label>
                <textarea
                  value={editLyrics}
                  onChange={e => setEditLyrics(e.target.value)}
                  rows={15}
                  className="w-full p-3 rounded-xl border text-sm font-mono"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Edita la letra y agrega los acordes con // al inicio de cada línea"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (parsedSongs.length > 1) {
                      setImportStep('select-hymnal');
                    } else {
                      setImportStep('choice');
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  ‹ Cancelar
                </button>
                <button
                  onClick={saveEditedSongWithHymnal}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  <Save size={18} /> Guardar en cancionero
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return null;
}
