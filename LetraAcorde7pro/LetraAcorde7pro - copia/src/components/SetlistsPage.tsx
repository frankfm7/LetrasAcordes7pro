import { useState, useMemo, useEffect, useRef } from 'react';
import { Song, Setlist, SetlistSong } from '../types';
import { songs as allSongs, hymnals } from '../data/songs';
import { useApp } from '../context/AppContext';
import { useNotification } from './NotificationProvider';
import { Plus, Trash2, Music, Clock, ChevronUp, ChevronDown, ChevronLeft, GripVertical, X, MoreVertical, Edit2, CheckSquare, Square, Search, Share2, Download, Camera, Copy, Star, ArrowRight, ClipboardPaste, ListPlus, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SetlistExtractor from './SetlistExtractor';

export default function SetlistsPage({ onSelectSong, onBack }: { onSelectSong: (song: Song) => void; onBack?: () => void }) {
  const { state, addSetlist, removeSetlist, addSongToSetlist, removeSongFromSetlist, removeMultipleSongsFromSetlist, updateSetlistSong, toggleFavorite, addMultipleToFavorites, updateCustomSong } = useApp();
  const { showNotification } = useNotification();
  const [selectedSetlist, setSelectedSetlist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtractor, setShowExtractor] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [newSetlistName, setNewSetlistName] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [listSelectionMode, setListSelectionMode] = useState(false);
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [showListSelectionMenu, setShowListSelectionMenu] = useState(false);
  const [copiedSongs, setCopiedSongs] = useState<Song[]>([]);
  const longPressTimerRef = useRef<number | null>(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  const editRef = useRef<HTMLDivElement>(null);

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

  const hasCopiedSongs = useMemo(() => {
    const stored = localStorage.getItem('cancionero-copied-songs');
    if (!stored) return false;
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }, [copiedSongs]);

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

  const allAvailableSongs = useMemo(() => {
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);

  const currentSetlist = useMemo(() => {
    return state.setlists.find(s => s.id === selectedSetlist);
  }, [state.setlists, selectedSetlist]);

  const filteredSongs = useMemo(() => {
    if (!songSearchQuery.trim()) return allAvailableSongs;
    const query = songSearchQuery.toLowerCase();
    return allAvailableSongs.filter(song =>
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.code.toLowerCase().includes(query)
    );
  }, [songSearchQuery, allAvailableSongs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editRef.current && !editRef.current.contains(event.target as Node)) {
        setEditingItem(null);
      }
    };
    if (editingItem) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingItem]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-add-menu]')) {
        setShowAddMenu(false);
      }
    };
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-item-menu]')) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-selection-menu]')) {
        setShowSelectionMenu(false);
      }
      if (!target.closest('[data-list-selection-menu]')) {
        setShowListSelectionMenu(false);
      }
    };
    if (showSelectionMenu || showListSelectionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSelectionMenu, showListSelectionMenu]);

  const createSetlist = () => {
    if (newSetlistName.trim()) {
      addSetlist(newSetlistName.trim());
      setNewSetlistName('');
      setShowCreateModal(false);
    }
  };

  const removeSong = (songId: string) => {
    if (!selectedSetlist) return;
    removeSongFromSetlist(selectedSetlist, songId);
    setOpenMenuId(null);
  };

  const removeSelectedItems = () => {
    if (!selectedSetlist || selectedItems.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedItems.size} canción(es)?`)) return;

    const songIds = Array.from(selectedItems);
    removeMultipleSongsFromSetlist(selectedSetlist, songIds);

    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const selectAllSongs = () => {
    if (!currentSetlist) return;
    if (selectedItems.size === currentSetlist.songs.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(currentSetlist.songs.map(s => s.songId)));
    }
  };

  const toggleListSelection = (listId: string) => {
    const newSelected = new Set(selectedLists);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelectedLists(newSelected);
  };

  const selectAllLists = () => {
    if (selectedLists.size === state.setlists.length) {
      setSelectedLists(new Set());
    } else {
      setSelectedLists(new Set(state.setlists.map(l => l.id)));
    }
  };

  const deleteSelectedLists = () => {
    if (selectedLists.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedLists.size} lista(s)?`)) return;

    selectedLists.forEach(listId => {
      removeSetlist(listId);
    });

    setSelectedLists(new Set());
    setListSelectionMode(false);
  };

  const shareSelectedLists = () => {
    if (selectedLists.size === 0) return;

    const selectedListsData = state.setlists.filter(l => selectedLists.has(l.id));
    const text = selectedListsData.map(list => {
      const songs = list.songs.map((ss, i) => {
        const song = allAvailableSongs.find(s => s.id === ss.songId);
        return `  ${i + 1}. ${song?.title || 'Sin canción'}`;
      }).join('\n');
      return `📋 ${list.name} (${list.songs.length} canciones)\n${songs}`;
    }).join('\n\n');

    if (navigator.share) {
      navigator.share({ title: 'Listas de canciones', text });
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Listas copiadas al portapapeles', 'success');
    }
  };

  const exportSelectedLists = () => {
    if (selectedLists.size === 0) return;

    const selectedListsData = state.setlists.filter(l => selectedLists.has(l.id));
    const data = {
      exportDate: new Date().toISOString(),
      lists: selectedListsData.map(list => ({
        name: list.name,
        songs: list.songs.map(ss => {
          const song = allAvailableSongs.find(s => s.id === ss.songId);
          return {
            title: song?.title,
            artist: song?.artist,
            code: song?.code,
            key: song?.key,
          };
        }),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listas_seleccionadas.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySelectedItems = () => {
    if (!selectedSetlist || selectedItems.size === 0) return;

    const selectedSongsList = currentSetlist!.songs.filter(s => selectedItems.has(s.songId));
    const songsToCopy = selectedSongsList.map(ss => allAvailableSongs.find(s => s.id === ss.songId)).filter(Boolean) as Song[];

    localStorage.setItem('cancionero-copied-songs', JSON.stringify(songsToCopy));
    setCopiedSongs(songsToCopy);

    const text = selectedSongsList.map((ss, i) => {
      const song = allAvailableSongs.find(s => s.id === ss.songId);
      return `${i + 1}. ${song?.title || 'Sin canción'} - ${song?.artist || ''}`;
    }).join('\n');

    navigator.clipboard.writeText(text);
    showNotification(`${selectedItems.size} canción(es) copiada(s). Puedes pegarlas en cualquier lista`, 'success');
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const pasteSongs = () => {
    if (!selectedSetlist) return;

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

    const startOrder = currentSetlist!.songs.length;

    songsToPaste.forEach((song, index) => {
      addSongToSetlist(selectedSetlist, {
        songId: song.id,
        transposition: 0,
        notes: '',
        order: startOrder + index,
      });
    });

    localStorage.removeItem('cancionero-copied-songs');
    setCopiedSongs([]);

    showNotification(`${songsToPaste.length} canción(es) pegada(s) en la lista`, 'success');
  };

  const addSelectedToFavorites = () => {
    if (selectedItems.size === 0) return;

    const songIds = Array.from(selectedItems);
    addMultipleToFavorites(songIds);

    showNotification(`${selectedItems.size} canción(es) agregada(s) a favoritos`, 'success');
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const shareSelectedItems = () => {
    if (!currentSetlist || selectedItems.size === 0) return;

    const selectedSongs = currentSetlist.songs.filter(s => selectedItems.has(s.songId));
    const text = `Canciones de ${currentSetlist.name}:\n\n${selectedSongs.map((ss, i) => {
      const song = allAvailableSongs.find(s => s.id === ss.songId);
      return `${i + 1}. ${song?.title || 'Sin canción'} - ${song?.artist || ''}`;
    }).join('\n')}`;

    if (navigator.share) {
      navigator.share({ title: 'Canciones seleccionadas', text });
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Lista copiada al portapapeles', 'success');
    }

    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const exportSelectedItems = () => {
    if (!currentSetlist || selectedItems.size === 0) return;

    const selectedSongs = currentSetlist.songs.filter(s => selectedItems.has(s.songId));
    const data = {
      name: `${currentSetlist.name} - Selección`,
      songs: selectedSongs.map(ss => {
        const song = allAvailableSongs.find(s => s.id === ss.songId);
        return {
          title: song?.title,
          artist: song?.artist,
          code: song?.code,
          key: song?.key,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSetlist.name}_seleccion.json`;
    a.click();
    URL.revokeObjectURL(url);

    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const moveSelectedToHymnal = (hymnalId: string) => {
    if (selectedItems.size === 0) return;

    selectedItems.forEach(songId => {
      const song = allAvailableSongs.find(s => s.id === songId);
      if (song) {
        updateCustomSong({ ...song, hymnalId });
      }
    });

    showNotification(`${selectedItems.size} canción(es) movida(s)`, 'success');
    setSelectedItems(new Set());
    setSelectionMode(false);
    setShowMoveModal(false);
  };

  const addSelectedToList = (listId: string) => {
    if (selectedItems.size === 0) return;

    selectedItems.forEach(songId => {
      addSongToSetlist(listId, {
        songId,
        transposition: 0,
        notes: '',
        order: 0,
      });
    });

    showNotification(`${selectedItems.size} canción(es) agregada(s) a la lista`, 'success');
    setSelectedItems(new Set());
    setSelectionMode(false);
    setShowAddToListModal(false);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!currentSetlist) return;

    const songs = [...currentSetlist.songs];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= songs.length) return;

    [songs[index], songs[newIndex]] = [songs[newIndex], songs[index]];

    songs.forEach((song, idx) => {
      updateSetlistSong(selectedSetlist!, song.songId, { order: idx });
    });
  };

  const handleExtracted = (items: string[]) => {
    const newListName = `Lista extraída ${state.setlists.length + 1}`;
    addSetlist(newListName);

    const newList = state.setlists.find(s => s.name === newListName);
    if (newList) {
      items.forEach((text, index) => {
        const matchingSong = allAvailableSongs.find(song =>
          song.title.toLowerCase().includes(text.toLowerCase()) ||
          text.toLowerCase().includes(song.title.toLowerCase())
        );

        if (matchingSong) {
          addSongToSetlist(newList.id, {
            songId: matchingSong.id,
            transposition: 0,
            notes: '',
            order: index,
          });
        }
      });

      setSelectedSetlist(newList.id);
    }

    setShowExtractor(false);
  };

  const toggleItemSelection = (songId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedItems(newSelected);
  };

  const handleLongPressStart = (songId: string) => {
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressTriggered(true);
      if (!selectionMode) {
        setSelectionMode(true);
        setReorderMode(false);
      }
      toggleItemSelection(songId);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setTimeout(() => {
        setLongPressTriggered(false);
      }, 100);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSongClick = (song: Song) => {
    if (selectionMode) {
      toggleItemSelection(song.id);
    } else {
      onSelectSong(song);
    }
  };

  const shareSetlist = () => {
    if (!currentSetlist) return;

    const text = `Lista: ${currentSetlist.name}\n\n${currentSetlist.songs.map((ss, i) => {
      const song = allAvailableSongs.find(s => s.id === ss.songId);
      return `${i + 1}. ${song?.title || 'Sin canción'}`;
    }).join('\n')}`;

    if (navigator.share) {
      navigator.share({ title: currentSetlist.name, text });
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Lista copiada al portapapeles', 'success');
    }
  };

  const exportSetlist = () => {
    if (!currentSetlist) return;

    const data = {
      name: currentSetlist.name,
      songs: currentSetlist.songs.map(ss => {
        const song = allAvailableSongs.find(s => s.id === ss.songId);
        return {
          title: song?.title,
          artist: song?.artist,
          code: song?.code,
          key: song?.key,
          transposition: ss.transposition,
          notes: ss.notes,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSetlist.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (selectedSetlist && currentSetlist) {
    return (
      <div className="space-y-4 pb-20">
        {/* Header de Lista Selección */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedSetlist(null);
              setSelectionMode(false);
              setSelectedItems(new Set());
            }}
            className="p-2 rounded-xl"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{currentSetlist.name}</h2>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{currentSetlist.songs.length} canciones</span>
            </div>
          </div>
          <button
            onClick={() => {
              setReorderMode(!reorderMode);
              setSelectionMode(false);
            }}
            className="p-2 rounded-xl"
            style={{ backgroundColor: reorderMode ? 'var(--accent)' : 'var(--bg-tertiary)', color: reorderMode ? 'white' : 'var(--text-primary)' }}
            title="Reordenar"
          >
            <GripVertical size={20} />
          </button>
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              setReorderMode(false);
              setSelectedItems(new Set());
            }}
            className="p-2 rounded-xl"
            style={{ backgroundColor: selectionMode ? 'var(--accent)' : 'var(--bg-tertiary)', color: selectionMode ? 'white' : 'var(--text-primary)' }}
            title="Seleccionar"
          >
            <CheckSquare size={20} />
          </button>
          {hasCopiedSongs && !selectionMode && !reorderMode && (
            <button
              onClick={pasteSongs}
              className="p-2 rounded-xl"
              style={{ backgroundColor: 'var(--gold)', color: 'white' }}
              title={`Pegar ${copiedSongsCount} canción(es) copiada(s)`}
            >
              <ClipboardPaste size={20} />
            </button>
          )}
          <div className="relative" data-item-menu>
            <button
              onClick={() => setOpenMenuId(openMenuId === 'list-menu' ? null : 'list-menu')}
              className="p-2 rounded-xl"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <MoreVertical size={20} />
            </button>

            {openMenuId === 'list-menu' && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg overflow-hidden z-50"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                <button
                  onClick={() => { shareSetlist(); setOpenMenuId(null); }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Share2 size={14} /> Compartir
                </button>
                <button
                  onClick={() => { exportSetlist(); setOpenMenuId(null); }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Download size={14} /> Exportar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Acciones de Selección */}
        {selectionMode && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
            <button
              onClick={selectAllSongs}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {selectedItems.size === currentSetlist.songs.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
            {selectedItems.size > 0 && (
              <>
                <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  {selectedItems.size} seleccionado(s)
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
                        onClick={() => { addSelectedToFavorites(); setShowSelectionMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Star size={16} style={{ color: 'var(--gold)' }} /> Favoritos
                      </button>
                      <button
                        onClick={() => { copySelectedItems(); setShowSelectionMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                      >
                        <Copy size={16} /> Copiar
                      </button>
                      <button
                        onClick={() => { setShowAddToListModal(true); setShowSelectionMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                      >
                        <ListPlus size={16} /> Agregar a otra lista
                      </button>
                      <button
                        onClick={() => { shareSelectedItems(); setShowSelectionMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                      >
                        <Share2 size={16} /> Compartir
                      </button>
                      <button
                        onClick={() => { exportSelectedItems(); setShowSelectionMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                      >
                        <Download size={16} /> Exportar
                      </button>
                      <button
                        onClick={() => { setShowMoveModal(true); setShowSelectionMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t"
                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                      >
                        <ArrowRightLeft size={16} /> Mover a cancionero
                      </button>
                      <button
                        onClick={() => { removeSelectedItems(); setShowSelectionMenu(false); }}
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

        {/* Lista de Canciones */}
        {currentSetlist.songs.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
            <Music size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              No hay canciones en esta lista
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentSetlist.songs.map((item, index) => {
              const song = allAvailableSongs.find(s => s.id === item.songId);
              const isSelected = selectedItems.has(item.songId);

              return (
                <div
                  key={item.songId || index}
                  className="rounded-2xl border p-3 flex items-center gap-3 transition-all"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--card-bg)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                  }}
                  onTouchStart={() => handleLongPressStart(item.songId)}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(item.songId)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                >
                  {reorderMode && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:opacity-80 disabled:opacity-30"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === currentSetlist.songs.length - 1}
                        className="p-1 rounded hover:opacity-80 disabled:opacity-30"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  )}

                  {selectionMode && (
                    <button
                      onClick={() => toggleItemSelection(item.songId)}
                      className="p-1"
                      style={{ color: 'var(--accent)' }}
                    >
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  )}

                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => song && handleSongClick(song)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold w-5" style={{ color: 'var(--accent)' }}>
                        {index + 1}.
                      </span>
                      <span className="font-semibold text-sm truncate">
                        {song?.title || 'Canción no encontrada'}
                      </span>
                    </div>
                    {song && (
                      <div className="text-xs flex items-center gap-2 mt-1" style={{ color: 'var(--text-muted)' }}>
                        <span>{song.artist}</span>
                        <span>•</span>
                        <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{song.key}</span>
                        <span>•</span>
                        <span>{song.timeSignature}</span>
                      </div>
                    )}
                  </div>

                  {!reorderMode && !selectionMode && (
                    <button
                      onClick={() => removeSong(item.songId)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Eliminar de la lista"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Botón Flotante para Agregar Canción */}
        <div className="fixed bottom-20 right-4 z-30" data-add-menu>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 hover:scale-105"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <Plus size={24} />
          </button>

          {showAddMenu && (
            <div
              className="absolute right-0 bottom-16 w-80 rounded-2xl shadow-xl p-4 space-y-3 z-50"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <h4 className="font-bold text-sm">Agregar canción a la lista</h4>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar por título, artista o código..."
                  value={songSearchQuery}
                  onChange={e => setSongSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-transparent"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredSongs.slice(0, 20).map(song => {
                  const isAlreadyInList = currentSetlist.songs.some(s => s.songId === song.id);
                  return (
                    <button
                      key={song.id}
                      disabled={isAlreadyInList}
                      onClick={() => {
                        addSongToSetlist(selectedSetlist, {
                          songId: song.id,
                          transposition: 0,
                          notes: '',
                          order: currentSetlist.songs.length,
                        });
                        setShowAddMenu(false);
                        setSongSearchQuery('');
                      }}
                      className="w-full p-2 text-left rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-xs disabled:opacity-40"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold truncate">{song.title}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{song.artist}</div>
                      </div>
                      <span className="font-mono font-bold shrink-0">{song.key}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Mover a Cancionero */}
        <AnimatePresence>
          {showMoveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowMoveModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl p-5"
                style={{ backgroundColor: 'var(--card-bg)' }}
              >
                <h3 className="font-bold text-lg mb-3">Mover a otro cancionero</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...hymnals, ...state.customHymnals].map(hymnal => (
                    <button
                      key={hymnal.id}
                      onClick={() => moveSelectedToHymnal(hymnal.id)}
                      className="w-full text-left p-3 rounded-xl border transition-all hover:scale-[1.01]"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{hymnal.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{hymnal.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{hymnal.language}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Agregar a otra lista */}
        <AnimatePresence>
          {showAddToListModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowAddToListModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl p-5"
                style={{ backgroundColor: 'var(--card-bg)' }}
              >
                <h3 className="font-bold text-lg mb-3">Agregar canciones a lista</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {state.setlists.filter(l => l.id !== selectedSetlist).map(list => (
                    <button
                      key={list.id}
                      onClick={() => addSelectedToList(list.id)}
                      className="w-full text-left p-3 rounded-xl border transition-all hover:scale-[1.01]"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="font-medium text-sm">{list.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {list.songs.length} canciones
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Vista Principal de Múltiples Listas
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Listas de Canciones</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Organiza tus canciones para cultos, ensayos o eventos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setListSelectionMode(!listSelectionMode);
              setSelectedLists(new Set());
            }}
            className="p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            style={{ backgroundColor: listSelectionMode ? 'var(--accent)' : 'var(--bg-tertiary)', color: listSelectionMode ? 'white' : 'var(--text-primary)' }}
          >
            <CheckSquare size={16} />
          </button>
          <button
            onClick={() => setShowExtractor(true)}
            className="p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
            title="Extraer desde imagen o texto"
          >
            <Camera size={16} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <Plus size={16} /> Nueva Lista
          </button>
        </div>
      </div>

      {/* Controles de Selección de Listas en Lote */}
      {listSelectionMode && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
          <button
            onClick={selectAllLists}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            {selectedLists.size === state.setlists.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>
          {selectedLists.size > 0 && (
            <>
              <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                {selectedLists.size} seleccionada(s)
              </span>
              <div className="flex-1" />
              <button
                onClick={shareSelectedLists}
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                title="Compartir listas"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={exportSelectedLists}
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                title="Exportar listas"
              >
                <Download size={16} />
              </button>
              <button
                onClick={deleteSelectedLists}
                className="p-2 rounded-lg text-red-500"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                title="Eliminar listas"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Rejilla de Listas */}
      {state.setlists.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
          <Music size={48} className="mx-auto mb-3 opacity-40" />
          <h3 className="font-bold text-base mb-1">No tienes listas guardadas</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Crea tu primera lista para organizar las canciones de tus servicios
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <Plus size={14} /> Crear Lista
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.setlists.map(list => {
            const isSelected = selectedLists.has(list.id);
            return (
              <div
                key={list.id}
                onClick={() => {
                  if (listSelectionMode) {
                    toggleListSelection(list.id);
                  } else {
                    setSelectedSetlist(list.id);
                  }
                }}
                className="rounded-2xl border p-5 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
                style={{
                  backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--card-bg)',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {listSelectionMode && (
                        <span style={{ color: 'var(--accent)' }}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </span>
                      )}
                      <h3 className="font-bold text-base truncate">{list.name}</h3>
                    </div>
                    {!listSelectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Estás seguro de eliminar la lista "${list.name}"?`)) {
                            removeSetlist(list.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>
                    {list.songs.length} canciones
                  </p>

                  <div className="space-y-1">
                    {list.songs.slice(0, 3).map((item, i) => {
                      const song = allAvailableSongs.find(s => s.id === item.songId);
                      return (
                        <div key={i} className="text-xs truncate flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                          <span className="font-bold text-[10px]">•</span>
                          <span>{song?.title || 'Canción'}</span>
                        </div>
                      );
                    })}
                    {list.songs.length > 3 && (
                      <div className="text-[10px] font-bold mt-1" style={{ color: 'var(--text-muted)' }}>
                        +{list.songs.length - 3} más
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}>
                  <span>Ver lista completa</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Lista */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-5 space-y-4"
              style={{ backgroundColor: 'var(--card-bg)' }}
            >
              <h3 className="font-bold text-lg">Nueva Lista de Canciones</h3>
              <input
                type="text"
                placeholder="Nombre de la lista (ej: Culto Domingo Mañana)"
                value={newSetlistName}
                onChange={e => setNewSetlistName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createSetlist()}
                autoFocus
                className="w-full p-3 text-sm rounded-xl border bg-transparent"
                style={{ borderColor: 'var(--border-color)' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={createSetlist}
                  disabled={!newSetlistName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  Crear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extractor Modal */}
      {showExtractor && (
        <SetlistExtractor
          onExtracted={handleExtracted}
          onClose={() => setShowExtractor(false)}
        />
      )}
    </div>
  );
}