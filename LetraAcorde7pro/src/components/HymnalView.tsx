--- src/components/HymnalView.tsx (原始)
import { useMemo, useState, useEffect, useRef } from 'react';
import { Song, Hymnal } from '../types';
import { songs as allSongs } from '../data/songs';
import { useApp } from '../context/AppContext';
import { useNotification } from './NotificationProvider';
import { ChevronLeft, Star, Music, MoreVertical, Edit, Trash2, Download, Share2, Plus, CheckSquare, Square, Copy, ClipboardPaste } from 'lucide-react';
import EditHymnalModal from './EditHymnalModal';
import AddSongModal from './AddSongModal';

export default function HymnalView({ hymnal: initialHymnal, onSelectSong, onBack }: {
  hymnal: Hymnal;
  onSelectSong: (song: Song, source?: any) => void;
  onBack: () => void;
}) {
  const { state, toggleFavorite, addMultipleToFavorites, isFavorite, removeCustomHymnal, updateCustomHymnal, removeMultipleCustomSongs, addMultipleCustomSongs } = useApp();
  const { showNotification } = useNotification();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [copiedSongs, setCopiedSongs] = useState<Song[]>([]);
  const longPressTimerRef = useRef<number | null>(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  // Obtener el himnario actualizado del estado
  const hymnal = useMemo(() => {
    const customHymnal = state.customHymnals.find(h => h.id === initialHymnal.id);
    return customHymnal || initialHymnal;
  }, [initialHymnal, state.customHymnals]);

  // Cargar canciones copiadas desde localStorage
  useEffect(() => {
    const storedCopiedSongs = localStorage.getItem('cancionero-copied-songs');
    if (storedCopiedSongs) {
      try {
        setCopiedSongs(JSON.parse(storedCopiedSongs));
      } catch (error) {
        console.error('Error loading copied songs:', error);
      }
    }
  }, []);

  // Verificar si hay canciones copiadas en localStorage
  const hasCopiedSongs = useMemo(() => {
    const stored = localStorage.getItem('cancionero-copied-songs');
    if (!stored) return false;
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }, [copiedSongs]); // Se recalcula cuando copiedSongs cambia

  const copiedSongsCount = useMemo(() => {
    const stored = localStorage.getItem('cancionero-copied-songs');
    if (!stored) return 0;
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, [copiedSongs]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-menu]')) {
        setShowMenu(false);
      }
      if (!target.closest('[data-selection-menu]')) {
        setShowSelectionMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Prevenir el comportamiento del botón atrás del navegador
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      onBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);

  const hymnalSongs = useMemo(() => {
    // Crear un mapa de canciones personalizadas por ID
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));

    // Combinar: usar versión personalizada si existe, sino usar predeterminada
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);

    // Agregar canciones personalizadas que no están en las predeterminadas
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));

    // Filtrar por himnario
    return [...combinedSongs, ...newCustomSongs].filter(s => s.hymnalId === hymnal.id);
  }, [hymnal.id, state.customSongs]);

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar "${hymnal.name}"? Esta acción no se puede deshacer.`)) {
      removeCustomHymnal(hymnal.id);
      onBack();
    }
  };

  const toggleSongSelection = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const handleDeleteSelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    if (confirm(`¿Estás seguro de eliminar ${selectedSongs.size} canción(es)? Esta acción no se puede deshacer.`)) {
      const songIds = Array.from(selectedSongs);
      removeMultipleCustomSongs(songIds);
      setSelectedSongs(new Set());
      setSelectionMode(false);
    }
  };

  const selectAllSongs = () => {
    // Si ya están todas seleccionadas, deseleccionar todas
    if (selectedSongs.size === hymnalSongs.length) {
      setSelectedSongs(new Set());
    } else {
      // Seleccionar todas
      setSelectedSongs(new Set(hymnalSongs.map(s => s.id)));
    }
  };

  const copySelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    const selectedSongsList = hymnalSongs.filter(s => selectedSongs.has(s.id));

    // Guardar canciones completas en localStorage para poder pegarlas después
    localStorage.setItem('cancionero-copied-songs', JSON.stringify(selectedSongsList));
    setCopiedSongs(selectedSongsList);

    // También copiar texto al portapapeles para compatibilidad
    const text = selectedSongsList.map((song, i) => `${i + 1}. ${song.title} - ${song.artist}`).join('\n');
    navigator.clipboard.writeText(text);

    showNotification(`${selectedSongs.size} canción(es) copiada(s). Puedes pegarlas en cualquier cancionero`, 'success');
  };

  const pasteSongs = () => {
    // Leer directamente desde localStorage para asegurar datos actualizados
    const storedCopiedSongs = localStorage.getItem('cancionero-copied-songs');
    if (!storedCopiedSongs) {
      showNotification('No hay canciones copiadas para pegar', 'error');
      return;
    }

    let songsToPaste: Song[];
    try {
      songsToPaste = JSON.parse(storedCopiedSongs);
    } catch (error) {
      console.error('Error parsing copied songs:', error);
      showNotification('Error al leer las canciones copiadas', 'error');
      return;
    }

    if (songsToPaste.length === 0) {
      showNotification('No hay canciones copiadas para pegar', 'error');
      return;
    }

    const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
    const startNumber = hymnalSongs.length + 1;
    const timestamp = Date.now();

    // Crear todas las canciones nuevas primero
    const newSongs: Song[] = songsToPaste.map((song, index) => ({
      ...song,
      id: `custom-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      hymnalId: hymnal.id,
      code: `${prefix}${startNumber + index}`,
      number: startNumber + index,
    }));

    // Agregar todas las canciones de una sola vez
    addMultipleCustomSongs(newSongs);

    // Limpiar el localStorage y el estado local después de pegar
    localStorage.removeItem('cancionero-copied-songs');
    setCopiedSongs([]);

    showNotification(`${newSongs.length} canción(es) pegada(s) en ${hymnal.name}`, 'success');
  };

  const addSelectedToFavorites = () => {
    if (selectedSongs.size === 0) return;
    const songIds = Array.from(selectedSongs);
    addMultipleToFavorites(songIds);
    showNotification(`${selectedSongs.size} canción(es) agregada(s) a favoritos`, 'success');
    setSelectedSongs(new Set());
    setSelectionMode(false);
  };

  const shareSelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    const selectedSongsList = hymnalSongs.filter(s => selectedSongs.has(s.id));
    const text = `Canciones de ${hymnal.name}:\n\n${selectedSongsList.map((song, i) => `${i + 1}. ${song.title} - ${song.artist}`).join('\n')}`;

    if (navigator.share) {
      navigator.share({ title: 'Canciones seleccionadas', text });
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Lista copiada al portapapeles para compartir', 'success');
    }
  };

  const exportSelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    const selectedSongsList = hymnalSongs.filter(s => selectedSongs.has(s.id));
    const data = {
      hymnalName: hymnal.name,
      selectedSongs: selectedSongsList.map(song => ({
        title: song.title,
        artist: song.artist,
        code: song.code,
        key: song.key,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hymnal.name}_seleccion.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const data = {
      hymnal,
      songs: hymnalSongs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hymnal.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `${hymnal.name}\n${hymnalSongs.length} canciones\n\nCanciones:\n${hymnalSongs.map(s => `- ${s.title}`).join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: hymnal.name,
          text: text
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Información copiada al portapapeles', 'success');
    }
  };

  // Funciones para clic largo (selección múltiple en móvil)
  const handleLongPressStart = (songId: string) => {
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressTriggered(true);
      if (!selectionMode) {
        setSelectionMode(true);
      }
      toggleSongSelection(songId);
      // Vibración si está disponible
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      // Resetear el flag después de un breve delay
      setTimeout(() => {
        setLongPressTriggered(false);
      }, 100);
    }, 500); // 500ms para activar clic largo
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSongClick = (song: Song) => {
    if (selectionMode) {
      toggleSongSelection(song.id);
    } else {
      onSelectSong(song, { type: 'hymnal', id: hymnal.id, name: hymnal.name } as any);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
             style={{ backgroundColor: hymnal.color + '20' }}>
          {hymnal.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{hymnal.name}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {hymnalSongs.length} canciones • {hymnal.language}
          </p>
        </div>
        {/* Botón modo selección */}
        <button
          onClick={() => {
            setSelectionMode(!selectionMode);
            setSelectedSongs(new Set());
          }}
          className="p-2 rounded-lg"
          style={{ backgroundColor: selectionMode ? 'var(--accent)' : 'var(--bg-tertiary)', color: selectionMode ? 'white' : 'var(--text-primary)' }}
          title={selectionMode ? 'Cancelar selección' : 'Seleccionar canciones'}
        >
          <CheckSquare size={20} />
        </button>
        {/* Botón pegar canciones */}
        {hasCopiedSongs && !selectionMode && (
          <button
            onClick={pasteSongs}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--gold)', color: 'white' }}
            title={`Pegar ${copiedSongsCount} canción(es) copiada(s)`}
          >
            <ClipboardPaste size={20} />
          </button>
        )}
        {/* Botón agregar canción */}
        {!selectionMode && (
          <button
            onClick={() => setShowAddSongModal(true)}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            title="Agregar canción"
          >
            <Plus size={20} />
          </button>
        )}
        {/* Menú de opciones para todos los cancioneros */}
        <div className="relative" data-menu>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <MoreVertical size={20} />
          </button>
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowEditModal(true);
                  }}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Edit size={16} /> Editar
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleExport();
                  }}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Download size={16} /> Exportar
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleShare();
                  }}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Share2 size={16} /> Compartir
                </button>
                {hymnal.isCustom && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 text-red-500"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
      </div>

      {/* Selection Actions Bar */}
      {selectionMode && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
          <button
            onClick={selectAllSongs}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            {selectedSongs.size > 0 && selectedSongs.size === hymnalSongs.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>
          {selectedSongs.size > 0 && (
            <>
              <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                {selectedSongs.size} seleccionada(s)
              </span>
              <div className="flex-1" />
              <div className="relative" data-selection-menu>
                <button
                  onClick={() => setShowSelectionMenu(!showSelectionMenu)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  <MoreVertical size={16} /> Opciones
                </button>

                {showSelectionMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                  >
                    <button
                      onClick={() => {
                        addSelectedToFavorites();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Star size={16} style={{ color: 'var(--gold)' }} /> Favoritos
                    </button>
                    <button
                      onClick={() => {
                        copySelectedSongs();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    >
                      <Copy size={16} /> Copiar
                    </button>
                    <button
                      onClick={() => {
                        shareSelectedSongs();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    >
                      <Share2 size={16} /> Compartir
                    </button>
                    <button
                      onClick={() => {
                        exportSelectedSongs();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    >
                      <Download size={16} /> Exportar
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteSelectedSongs();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                      style={{ color: '#ef4444', borderColor: 'var(--border-color)' }}
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Songs List */}
      <div className="space-y-2">
        {hymnalSongs.map(song => (
          <div
            key={song.id}
            className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--border-color)',
              borderWidth: selectedSongs.has(song.id) ? '2px' : '1px'
            }}
          >
            {selectionMode && (
              <button
                onClick={() => toggleSongSelection(song.id)}
                className="p-1"
                style={{ color: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {selectedSongs.has(song.id) ? <CheckSquare size={20} /> : <Square size={20} />}
              </button>
            )}
            <button
              onClick={() => handleSongClick(song)}
              onMouseDown={() => handleLongPressStart(song.id)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(song.id)}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
              onContextMenu={(e) => {
                if (longPressTriggered) {
                  e.preventDefault();
                }
              }}
              className="flex-1 text-left"
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>
                  {song.code}
                </span>
                <span className="font-medium text-sm">{song.title}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM
              </div>
            </button>
            {!selectionMode && (
              <button
                onClick={() => toggleFavorite(song.id)}
                className="p-2 rounded-lg"
                style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}
              >
                <Star size={18} fill={isFavorite(song.id) ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        ))}
        {hymnalSongs.length === 0 && (
          <div className="text-center py-12">
            <Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay canciones en este himnario aún
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditHymnalModal
          hymnal={hymnal}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedHymnal) => {
            updateCustomHymnal(updatedHymnal);
            setShowEditModal(false);
          }}
        />
      )}

      {/* Add Song Modal */}
      {showAddSongModal && (
        <AddSongModal
          hymnal={hymnal}
          onClose={() => setShowAddSongModal(false)}
        />
      )}
    </div>
  );
}

+++ src/components/HymnalView.tsx (修改后)
import { useMemo, useState, useEffect, useRef } from 'react';
import { Song, Hymnal } from '../types';
import { songs as allSongs } from '../data/songs';
import { useApp } from '../context/AppContext';
import { useNotification } from './NotificationProvider';
import { generateMultipleSongsShareText } from '../utils/shareUtils';
import { ChevronLeft, Star, Music, MoreVertical, Edit, Trash2, Download, Share2, Plus, CheckSquare, Square, Copy, ClipboardPaste } from 'lucide-react';
import EditHymnalModal from './EditHymnalModal';
import AddSongModal from './AddSongModal';

export default function HymnalView({ hymnal: initialHymnal, onSelectSong, onBack }: {
  hymnal: Hymnal;
  onSelectSong: (song: Song, source?: any) => void;
  onBack: () => void;
}) {
  const { state, toggleFavorite, addMultipleToFavorites, isFavorite, removeCustomHymnal, updateCustomHymnal, removeMultipleCustomSongs, addMultipleCustomSongs } = useApp();
  const { showNotification } = useNotification();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [copiedSongs, setCopiedSongs] = useState<Song[]>([]);
  const longPressTimerRef = useRef<number | null>(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  // Obtener el himnario actualizado del estado
  const hymnal = useMemo(() => {
    const customHymnal = state.customHymnals.find(h => h.id === initialHymnal.id);
    return customHymnal || initialHymnal;
  }, [initialHymnal, state.customHymnals]);

  // Cargar canciones copiadas desde localStorage
  useEffect(() => {
    const storedCopiedSongs = localStorage.getItem('cancionero-copied-songs');
    if (storedCopiedSongs) {
      try {
        setCopiedSongs(JSON.parse(storedCopiedSongs));
      } catch (error) {
        console.error('Error loading copied songs:', error);
      }
    }
  }, []);

  // Verificar si hay canciones copiadas en localStorage
  const hasCopiedSongs = useMemo(() => {
    const stored = localStorage.getItem('cancionero-copied-songs');
    if (!stored) return false;
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }, [copiedSongs]); // Se recalcula cuando copiedSongs cambia

  const copiedSongsCount = useMemo(() => {
    const stored = localStorage.getItem('cancionero-copied-songs');
    if (!stored) return 0;
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, [copiedSongs]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-menu]')) {
        setShowMenu(false);
      }
      if (!target.closest('[data-selection-menu]')) {
        setShowSelectionMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Prevenir el comportamiento del botón atrás del navegador
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      onBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);

  const hymnalSongs = useMemo(() => {
    // Crear un mapa de canciones personalizadas por ID
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));

    // Combinar: usar versión personalizada si existe, sino usar predeterminada
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);

    // Agregar canciones personalizadas que no están en las predeterminadas
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));

    // Filtrar por himnario
    return [...combinedSongs, ...newCustomSongs].filter(s => s.hymnalId === hymnal.id);
  }, [hymnal.id, state.customSongs]);

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar "${hymnal.name}"? Esta acción no se puede deshacer.`)) {
      removeCustomHymnal(hymnal.id);
      onBack();
    }
  };

  const toggleSongSelection = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const handleDeleteSelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    if (confirm(`¿Estás seguro de eliminar ${selectedSongs.size} canción(es)? Esta acción no se puede deshacer.`)) {
      const songIds = Array.from(selectedSongs);
      removeMultipleCustomSongs(songIds);
      setSelectedSongs(new Set());
      setSelectionMode(false);
    }
  };

  const selectAllSongs = () => {
    // Si ya están todas seleccionadas, deseleccionar todas
    if (selectedSongs.size === hymnalSongs.length) {
      setSelectedSongs(new Set());
    } else {
      // Seleccionar todas
      setSelectedSongs(new Set(hymnalSongs.map(s => s.id)));
    }
  };

  const copySelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    const selectedSongsList = hymnalSongs.filter(s => selectedSongs.has(s.id));

    // Guardar canciones completas en localStorage para poder pegarlas después
    localStorage.setItem('cancionero-copied-songs', JSON.stringify(selectedSongsList));
    setCopiedSongs(selectedSongsList);

    // También copiar texto al portapapeles para compatibilidad
    const text = selectedSongsList.map((song, i) => `${i + 1}. ${song.title} - ${song.artist}`).join('\n');
    navigator.clipboard.writeText(text);

    showNotification(`${selectedSongs.size} canción(es) copiada(s). Puedes pegarlas en cualquier cancionero`, 'success');
  };

  const pasteSongs = () => {
    // Leer directamente desde localStorage para asegurar datos actualizados
    const storedCopiedSongs = localStorage.getItem('cancionero-copied-songs');
    if (!storedCopiedSongs) {
      showNotification('No hay canciones copiadas para pegar', 'error');
      return;
    }

    let songsToPaste: Song[];
    try {
      songsToPaste = JSON.parse(storedCopiedSongs);
    } catch (error) {
      console.error('Error parsing copied songs:', error);
      showNotification('Error al leer las canciones copiadas', 'error');
      return;
    }

    if (songsToPaste.length === 0) {
      showNotification('No hay canciones copiadas para pegar', 'error');
      return;
    }

    const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
    const startNumber = hymnalSongs.length + 1;
    const timestamp = Date.now();

    // Crear todas las canciones nuevas primero
    const newSongs: Song[] = songsToPaste.map((song, index) => ({
      ...song,
      id: `custom-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      hymnalId: hymnal.id,
      code: `${prefix}${startNumber + index}`,
      number: startNumber + index,
    }));

    // Agregar todas las canciones de una sola vez
    addMultipleCustomSongs(newSongs);

    // Limpiar el localStorage y el estado local después de pegar
    localStorage.removeItem('cancionero-copied-songs');
    setCopiedSongs([]);

    showNotification(`${newSongs.length} canción(es) pegada(s) en ${hymnal.name}`, 'success');
  };

  const addSelectedToFavorites = () => {
    if (selectedSongs.size === 0) return;
    const songIds = Array.from(selectedSongs);
    addMultipleToFavorites(songIds);
    showNotification(`${selectedSongs.size} canción(es) agregada(s) a favoritos`, 'success');
    setSelectedSongs(new Set());
    setSelectionMode(false);
  };

  const shareSelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    const selectedSongsList = hymnalSongs.filter(s => selectedSongs.has(s.id));
    const text = generateMultipleSongsShareText(selectedSongsList);

    if (navigator.share) {
      navigator.share({ title: 'Canciones seleccionadas', text });
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Canciones copiadas al portapapeles', 'success');
    }
  };

  const exportSelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    const selectedSongsList = hymnalSongs.filter(s => selectedSongs.has(s.id));
    const data = {
      hymnalName: hymnal.name,
      selectedSongs: selectedSongsList.map(song => ({
        title: song.title,
        artist: song.artist,
        code: song.code,
        key: song.key,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hymnal.name}_seleccion.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const data = {
      hymnal,
      songs: hymnalSongs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hymnal.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `${hymnal.name}\n${hymnalSongs.length} canciones\n\nCanciones:\n${hymnalSongs.map(s => `- ${s.title}`).join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: hymnal.name,
          text: text
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Información copiada al portapapeles', 'success');
    }
  };

  // Funciones para clic largo (selección múltiple en móvil)
  const handleLongPressStart = (songId: string) => {
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressTriggered(true);
      if (!selectionMode) {
        setSelectionMode(true);
      }
      toggleSongSelection(songId);
      // Vibración si está disponible
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      // Resetear el flag después de un breve delay
      setTimeout(() => {
        setLongPressTriggered(false);
      }, 100);
    }, 500); // 500ms para activar clic largo
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSongClick = (song: Song) => {
    if (selectionMode) {
      toggleSongSelection(song.id);
    } else {
      onSelectSong(song, { type: 'hymnal', id: hymnal.id, name: hymnal.name } as any);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
             style={{ backgroundColor: hymnal.color + '20' }}>
          {hymnal.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{hymnal.name}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {hymnalSongs.length} canciones • {hymnal.language}
          </p>
        </div>
        {/* Botón modo selección */}
        <button
          onClick={() => {
            setSelectionMode(!selectionMode);
            setSelectedSongs(new Set());
          }}
          className="p-2 rounded-lg"
          style={{ backgroundColor: selectionMode ? 'var(--accent)' : 'var(--bg-tertiary)', color: selectionMode ? 'white' : 'var(--text-primary)' }}
          title={selectionMode ? 'Cancelar selección' : 'Seleccionar canciones'}
        >
          <CheckSquare size={20} />
        </button>
        {/* Botón pegar canciones */}
        {hasCopiedSongs && !selectionMode && (
          <button
            onClick={pasteSongs}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--gold)', color: 'white' }}
            title={`Pegar ${copiedSongsCount} canción(es) copiada(s)`}
          >
            <ClipboardPaste size={20} />
          </button>
        )}
        {/* Botón agregar canción */}
        {!selectionMode && (
          <button
            onClick={() => setShowAddSongModal(true)}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            title="Agregar canción"
          >
            <Plus size={20} />
          </button>
        )}
        {/* Menú de opciones para todos los cancioneros */}
        <div className="relative" data-menu>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <MoreVertical size={20} />
          </button>
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowEditModal(true);
                  }}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Edit size={16} /> Editar
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleExport();
                  }}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Download size={16} /> Exportar
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleShare();
                  }}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Share2 size={16} /> Compartir
                </button>
                {hymnal.isCustom && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 text-red-500"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
      </div>

      {/* Selection Actions Bar */}
      {selectionMode && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
          <button
            onClick={selectAllSongs}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            {selectedSongs.size > 0 && selectedSongs.size === hymnalSongs.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>
          {selectedSongs.size > 0 && (
            <>
              <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                {selectedSongs.size} seleccionada(s)
              </span>
              <div className="flex-1" />
              <div className="relative" data-selection-menu>
                <button
                  onClick={() => setShowSelectionMenu(!showSelectionMenu)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  <MoreVertical size={16} /> Opciones
                </button>

                {showSelectionMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                  >
                    <button
                      onClick={() => {
                        addSelectedToFavorites();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Star size={16} style={{ color: 'var(--gold)' }} /> Favoritos
                    </button>
                    <button
                      onClick={() => {
                        copySelectedSongs();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    >
                      <Copy size={16} /> Copiar
                    </button>
                    <button
                      onClick={() => {
                        shareSelectedSongs();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    >
                      <Share2 size={16} /> Compartir
                    </button>
                    <button
                      onClick={() => {
                        exportSelectedSongs();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    >
                      <Download size={16} /> Exportar
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteSelectedSongs();
                        setShowSelectionMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                      style={{ color: '#ef4444', borderColor: 'var(--border-color)' }}
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Songs List */}
      <div className="space-y-2">
        {hymnalSongs.map(song => (
          <div
            key={song.id}
            className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--border-color)',
              borderWidth: selectedSongs.has(song.id) ? '2px' : '1px'
            }}
          >
            {selectionMode && (
              <button
                onClick={() => toggleSongSelection(song.id)}
                className="p-1"
                style={{ color: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {selectedSongs.has(song.id) ? <CheckSquare size={20} /> : <Square size={20} />}
              </button>
            )}
            <button
              onClick={() => handleSongClick(song)}
              onMouseDown={() => handleLongPressStart(song.id)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(song.id)}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
              onContextMenu={(e) => {
                if (longPressTriggered) {
                  e.preventDefault();
                }
              }}
              className="flex-1 text-left"
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>
                  {song.code}
                </span>
                <span className="font-medium text-sm">{song.title}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM
              </div>
            </button>
            {!selectionMode && (
              <button
                onClick={() => toggleFavorite(song.id)}
                className="p-2 rounded-lg"
                style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}
              >
                <Star size={18} fill={isFavorite(song.id) ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        ))}
        {hymnalSongs.length === 0 && (
          <div className="text-center py-12">
            <Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay canciones en este himnario aún
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditHymnalModal
          hymnal={hymnal}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedHymnal) => {
            updateCustomHymnal(updatedHymnal);
            setShowEditModal(false);
          }}
        />
      )}

      {/* Add Song Modal */}
      {showAddSongModal && (
        <AddSongModal
          hymnal={hymnal}
          onClose={() => setShowAddSongModal(false)}
        />
      )}
    </div>
  );
}