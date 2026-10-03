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
  
  const [exportStep, setExportStep] = useState<'choice' | 'single' | 'batch' | 'format'>('choice');
  const [exportType, setExportType] = useState<'single' | 'batch'>('single');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'text' | 'pdf' | 'word'>('text');
  
  const [importStep, setImportStep] = useState<'choice' | 'analyze' | 'select-hymnal' | 'edit' | 'select-hymnal-for-save'>('choice');
  const [parsedSongs, setParsedSongs] = useState<any[]>([]);
  const [selectedHymnalId, setSelectedHymnalId] = useState<string>('mis-canciones');
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLyrics, setEditLyrics] = useState('');
  const [tempHymnalIdForSave, setTempHymnalIdForSave] = useState<string>('mis-canciones');

  // CORRECCIÓN 1: Evitar duplicación de canciones
  const allAvailableSongs = useMemo(() => {
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);
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

  const toggleSongSelection = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) newSelected.delete(songId);
    else newSelected.add(songId);
    setSelectedSongs(newSelected);
  };

  const selectAll = () => {
    if (selectedSongs.size === filteredSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredSongs.map(s => s.id)));
    }
  };

  const exportAsText = (songs: Song[]) => {
    const content = songs.map((song) => {
      const lyrics = song.lyrics.replace(/\/\/[^\n]*\n/g, '').trim();
      return `Título: ${song.title}
Artista: ${song.artist}
Tonalidad: ${song.key}
Compás: ${song.timeSignature}
BPM: ${song.bpm}
Idioma: ${song.language}
Categorías: ${song.categories.join(', ')}
---
${lyrics}`;
    }).join('\n\n===\n\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songs.length === 1 ? songs[0].title : 'canciones'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exportado como texto', 'success');
  };

  const handleExport = () => {
    const songsToExport = exportType === 'single' 
      ? [allAvailableSongs.find(s => s.id === Array.from(selectedSongs)[0])!]
      : Array.from(selectedSongs).map(id => allAvailableSongs.find(s => s.id === id)!).filter(Boolean);
    
    if (songsToExport.length === 0) {
      showNotification('Selecciona al menos una canción', 'error');
      return;
    }
    
    switch (exportFormat) {
      case 'text':
        exportAsText(songsToExport);
        break;
      case 'pdf':
        showNotification('Exportación a PDF próximamente', 'info');
        break;
      case 'word':
        showNotification('Exportación a Word próximamente', 'info');
        break;
    }
    
    onClose();
  };

  const parseMultipleSongs = (text: string): any[] => {
    const songs: any[] = [];
    const songBlocks = text.split(/\n\s*={3,}\s*\n/);
    
    songBlocks.forEach((block) => {
      if (!block.trim()) return;
      
      const titleMatch = block.match(/Título:\s*(.+)/i);
      const artistMatch = block.match(/Artista:\s*(.+)/i);
      const keyMatch = block.match(/Tonalidad:\s*(.+)/i);
      const timeSigMatch = block.match(/Compás:\s*(.+)/i);
      const bpmMatch = block.match(/BPM:\s*(.+)/i);
      const langMatch = block.match(/Idioma:\s*(.+)/i);
      const catMatch = block.match(/Categorías:\s*(.+)/i);
      
      const lyricsStart = block.indexOf('---');
      const lyrics = lyricsStart !== -1 ? block.substring(lyricsStart + 3).trim() : block.trim();
      
      if (titleMatch) {
        songs.push({
          title: titleMatch[1].trim(),
          artist: artistMatch ? artistMatch[1].trim() : 'Desconocido',
          key: keyMatch ? keyMatch[1].trim() : 'C',
          timeSignature: timeSigMatch ? timeSigMatch[1].trim() : '4/4',
          bpm: bpmMatch ? parseInt(bpmMatch[1].trim()) : 100,
          language: langMatch ? langMatch[1].trim() : 'Castellano',
          categories: catMatch ? catMatch[1].split(',').map(c => c.trim()) : ['General'],
          lyrics: lyrics,
        });
      }
    });
    
    return songs;
  };

  // CORRECCIÓN 2: Usar prefijo correcto del cancionero
  const saveParsedSongs = () => {
    const selectedHymnal = [...hymnals, ...state.customHymnals].find(h => h.id === selectedHymnalId);
    if (!selectedHymnal) {
      showNotification('Cancionero no encontrado', 'error');
      return;
    }
    
    // CORRECCIÓN: Usar solo canciones personalizadas para calcular el siguiente número
    const allCustomSongs = state.customSongs;
    let currentNumber = getNextSongNumber(selectedHymnalId, allCustomSongs);
    
    const timestamp = Date.now();
    const newSongs: Song[] = parsedSongs.map((song, index) => {
      // CORRECCIÓN: Generar código con prefijo del cancionero
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

  const openHymnalSelectionForSave = () => {
    setTempHymnalIdForSave(selectedHymnalId);
    setImportStep('select-hymnal-for-save');
  };

  // CORRECCIÓN 2: Usar prefijo correcto del cancionero
  const saveEditedSongWithHymnal = () => {
    if (editingSongIndex === null) return;
    
    const song = parsedSongs[editingSongIndex];
    const selectedHymnal = [...hymnals, ...state.customHymnals].find(h => h.id === tempHymnalIdForSave);
    if (!selectedHymnal) {
      showNotification('Cancionero no encontrado', 'error');
      return;
    }
    
    // CORRECCIÓN: Usar solo canciones personalizadas
    const allCustomSongs = state.customSongs;
    const nextNumber = getNextSongNumber(tempHymnalIdForSave, allCustomSongs);
    
    // CORRECCIÓN: Generar código con prefijo del cancionero
    const code = generateSongCode(selectedHymnal, nextNumber);
    
    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: editTitle,
      artist: song.artist,
      code,
      number: nextNumber,
      hymnalId: tempHymnalIdForSave,
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

  const saveChangesOnly = () => {
    if (editingSongIndex === null) return;
    
    const updatedSongs = [...parsedSongs];
    updatedSongs[editingSongIndex] = {
      ...updatedSongs[editingSongIndex],
      title: editTitle,
      lyrics: editLyrics,
    };
    setParsedSongs(updatedSongs);
    
    showNotification('Cambios guardados en la lista', 'success');
    
    if (parsedSongs.length > 1) {
      setImportStep('select-hymnal');
    } else {
      setImportStep('choice');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'txt') {
        const text = await file.text();
        const parsedSongsResult = parseMultipleSongs(text);
        
        if (parsedSongsResult.length > 1) {
          const confirmed = window.confirm(
            `Se detectaron ${parsedSongsResult.length} canciones en el archivo.\n\n¿Deseas importar todas las canciones?`
          );
          
          if (confirmed) {
            setParsedSongs(parsedSongsResult);
            setImportStep('select-hymnal');
          }
        } else if (parsedSongsResult.length === 1) {
          setParsedSongs(parsedSongsResult);
          setEditingSongIndex(0);
          setEditTitle(parsedSongsResult[0].title);
          setEditLyrics(parsedSongsResult[0].lyrics);
          setImportStep('edit');
        } else {
          showNotification('No se encontraron canciones en el archivo', 'error');
        }
      } else {
        showNotification('Formato no soportado', 'error');
      }
    } catch (error) {
      console.error('Error importing:', error);
      showNotification('Error al importar', 'error');
    }
  };

  if (mode === 'import') {
    if (importStep === 'choice') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={onClose} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors" style={{ color: 'white' }}>‹</button>
              <h3 className="text-xl font-bold flex-1 text-center">Importar Canciones</h3>
              <div style={{ width: '48px' }}></div>
            </div>
            
            <div className="space-y-3">
              <label className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all cursor-pointer block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <input type="file" accept=".txt" onChange={handleImport} className="hidden" />
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
            
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                💡 Los cambios se guardarán en la lista de canciones detectadas. Podrás exportarlas o guardarlas en un cancionero después.
              </p>
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
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  💡 Usa // antes de los acordes. Ejemplo: //Am F Em Am
                </p>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    if (parsedSongs.length > 1) {
                      setImportStep('select-hymnal');
                    } else {
                      setImportStep('choice');
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  ‹ Cancelar
                </button>
                <button
                  onClick={saveChangesOnly}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  💾 Guardar cambios
                </button>
                <button
                  onClick={openHymnalSelectionForSave}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  💾 Guardar esta canción en cancionero
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (importStep === 'select-hymnal-for-save' && editingSongIndex !== null) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setImportStep('edit')}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
                style={{ color: 'white' }}
              >
                ‹
              </button>
              <h3 className="text-xl font-bold flex-1 text-center">¿Dónde guardar esta canción?</h3>
              <div style={{ width: '48px' }}></div>
            </div>
            
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)' }}>
              <p className="text-sm font-semibold mb-2">📍 Selecciona el cancionero destino</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                La canción "{editTitle}" se guardará en el cancionero que selecciones.
              </p>
            </div>
            
            <div className="space-y-3 mb-4">
              <label className="text-xs font-bold mb-1.5 block">Cancionero</label>
              <div className="flex gap-2">
                <select
                  value={tempHymnalIdForSave}
                  onChange={e => setTempHymnalIdForSave(e.target.value)}
                  className="flex-1 p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {[...hymnals, ...state.customHymnals].map(h => (
                    <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setImportStep('edit')}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                ‹ Cancelar
              </button>
              <button
                onClick={saveEditedSongWithHymnal}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                <Save size={18} /> Guardar en Cancionero
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Modo exportación
  if (exportStep === 'choice') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Exportar Canciones</h3>
            <button onClick={onClose} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => { setExportType('single'); setExportStep('single'); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <FileText size={32} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="font-bold">Archivo Único</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Exportar una sola canción</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => { setExportType('batch'); setExportStep('batch'); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="font-bold">Exportación en Lote</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Exportar múltiples canciones</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (exportStep === 'single' || exportStep === 'batch') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">
                {exportStep === 'single' ? 'Seleccionar Canción' : 'Seleccionar Canciones'}
              </h3>
              {exportStep === 'batch' && (
                <p className="text-sm" style={{ color: 'var(--accent)' }}>
                  {selectedSongs.size} canción(es) seleccionada(s)
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="relative mb-4">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar canciones..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          
          {exportStep === 'batch' && (
            <button
              onClick={selectAll}
              className="mb-3 px-4 py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {selectedSongs.size === filteredSongs.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          )}
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSongs.map(song => (
              <div
                key={song.id}
                onClick={() => {
                  if (exportStep === 'single') {
                    setSelectedSongs(new Set([song.id]));
                    setExportStep('format');
                  } else {
                    toggleSongSelection(song.id);
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all"
                style={{
                  borderColor: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--border-color)',
                  backgroundColor: selectedSongs.has(song.id) ? 'var(--accent-light)' : 'var(--bg-secondary)',
                }}
              >
                {exportStep === 'batch' && (
                  <div style={{ color: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {selectedSongs.has(song.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-sm">{song.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {song.code} • {song.artist} • {song.key}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {exportStep === 'batch' && selectedSongs.size > 0 && (
            <button
              onClick={() => setExportStep('format')}
              className="w-full mt-4 py-3 rounded-xl font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              Continuar →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (exportStep === 'format') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Seleccionar Formato</h3>
            <button onClick={onClose} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => { setExportFormat('text'); handleExport(); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <FileText size={32} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="font-bold">Texto (.txt)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Archivo de texto plano</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => { setExportFormat('pdf'); handleExport(); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#ef4444' }} />
                <div>
                  <div className="font-bold">PDF (.pdf)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Documento PDF</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => { setExportFormat('word'); handleExport(); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#3b82f6' }} />
                <div>
                  <div className="font-bold">Word (.docx)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Documento de Word</div>
                </div>
              </div>
            </button>
          </div>
          
          <button
            onClick={() => setExportStep(exportType)}
            className="w-full mt-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return null;
}
