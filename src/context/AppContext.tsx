import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AppState, Setlist, SetlistSong, Hymnal, Song, Order } from '../types';
import { hymnals } from '../data/songs';

interface AppContextType {
  state: AppState;
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  addSetlist: (name: string) => void;
  removeSetlist: (id: string) => void;
  addSongToSetlist: (setlistId: string, song: SetlistSong) => void;
  removeSongFromSetlist: (setlistId: string, songId: string) => void;
  removeMultipleSongsFromSetlist: (setlistId: string, songIds: string[]) => void;
  updateSetlistSong: (setlistId: string, songId: string, updates: Partial<SetlistSong>) => void;
  reorderSetlist: (setlistId: string, songs: SetlistSong[]) => void;
  addOrder: (order: Order) => void;
  removeOrder: (id: string) => void;
  updateOrder: (order: Order) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: number) => void;
  setShowChords: (show: boolean) => void;
  setCapo: (capo: number) => void;
  updatePersonalNote: (songId: string, note: string) => void;
  addCustomHymnal: (hymnal: Hymnal) => void;
  removeCustomHymnal: (id: string) => void;
  updateCustomHymnal: (hymnal: Hymnal) => void;
  addCustomSong: (song: Song) => void;
  updateCustomSong: (song: Song) => void;
  removeCustomSong: (id: string) => void;
  addMultipleCustomSongs: (songs: Song[]) => void;
  removeMultipleCustomSongs: (ids: string[]) => void;
  addMultipleToFavorites: (songIds: string[]) => void;
}

const defaultState: AppState = {
  favorites: [],
  setlists: [],
  orders: [],
  preferences: { theme: 'dark', fontSize: 18, showChords: true, capo: 0 },
  personalNotes: {},
  customHymnals: [],
  customSongs: [],
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const loadCustomSongs = (): Song[] => {
    try {
      const saved = localStorage.getItem('cancionero-custom-songs');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  };

  const initialState = { ...defaultState, customSongs: loadCustomSongs() };
  const [state, setState] = useLocalStorage<AppState>('cancionero-ruah-state', initialState);

  useEffect(() => {
    if (!state.orders) setState(prev => ({ ...prev, orders: [] }));
  }, [state.orders, setState]);

  const toggleFavorite = useCallback((songId: string) => {
    setState(prev => ({
      ...prev,
      favorites: prev.favorites.includes(songId)
        ? prev.favorites.filter(id => id !== songId)
        : [...prev.favorites, songId],
    }));
  }, [setState]);

  const isFavorite = useCallback((songId: string) => state.favorites.includes(songId), [state.favorites]);

  const addSetlist = useCallback((name: string) => {
    const newSetlist: Setlist = {
      id: crypto.randomUUID(), name, songs: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: '',
    };
    setState(prev => ({ ...prev, setlists: [...prev.setlists, newSetlist] }));
  }, [setState]);

  const removeSetlist = useCallback((id: string) => {
    setState(prev => ({ ...prev, setlists: prev.setlists.filter(s => s.id !== id) }));
  }, [setState]);

  const addSongToSetlist = useCallback((setlistId: string, song: SetlistSong) => {
    setState(prev => ({
      ...prev,
      setlists: prev.setlists.map(s =>
        s.id === setlistId ? { ...s, songs: [...s.songs, song], updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, [setState]);

  const removeSongFromSetlist = useCallback((setlistId: string, songId: string) => {
    setState(prev => ({
      ...prev,
      setlists: prev.setlists.map(s =>
        s.id === setlistId ? { ...s, songs: s.songs.filter(song => song.songId !== songId), updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, [setState]);

  const removeMultipleSongsFromSetlist = useCallback((setlistId: string, songIds: string[]) => {
    setState(prev => ({
      ...prev,
      setlists: prev.setlists.map(s =>
        s.id === setlistId ? { ...s, songs: s.songs.filter(song => !songIds.includes(song.songId)), updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, [setState]);

  const updateSetlistSong = useCallback((setlistId: string, songId: string, updates: Partial<SetlistSong>) => {
    setState(prev => ({
      ...prev,
      setlists: prev.setlists.map(s =>
        s.id === setlistId ? { ...s, songs: s.songs.map(song => song.songId === songId ? { ...song, ...updates } : song), updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, [setState]);

  const reorderSetlist = useCallback((setlistId: string, songs: SetlistSong[]) => {
    setState(prev => ({
      ...prev,
      setlists: prev.setlists.map(s => s.id === setlistId ? { ...s, songs, updatedAt: new Date().toISOString() } : s),
    }));
  }, [setState]);

  const addOrder = useCallback((order: Order) => {
    setState(prev => ({ ...prev, orders: [...prev.orders, order] }));
  }, [setState]);

  const removeOrder = useCallback((id: string) => {
    setState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }));
  }, [setState]);

  const updateOrder = useCallback((order: Order) => {
    setState(prev => ({ ...prev, orders: prev.orders.map(o => o.id === order.id ? order : o) }));
  }, [setState]);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, preferences: { ...prev.preferences, theme } }));
  }, [setState]);

  const setFontSize = useCallback((fontSize: number) => {
    setState(prev => ({ ...prev, preferences: { ...prev.preferences, fontSize } }));
  }, [setState]);

  const setShowChords = useCallback((showChords: boolean) => {
    setState(prev => ({ ...prev, preferences: { ...prev.preferences, showChords } }));
  }, [setState]);

  const setCapo = useCallback((capo: number) => {
    setState(prev => ({ ...prev, preferences: { ...prev.preferences, capo } }));
  }, [setState]);

  const updatePersonalNote = useCallback((songId: string, note: string) => {
    setState(prev => ({ ...prev, personalNotes: { ...prev.personalNotes, [songId]: note } }));
  }, [setState]);

  const addCustomHymnal = useCallback((hymnal: Hymnal) => {
    setState(prev => ({ ...prev, customHymnals: [...prev.customHymnals, hymnal] }));
  }, [setState]);

  const removeCustomHymnal = useCallback((id: string) => {
    setState(prev => ({ ...prev, customHymnals: prev.customHymnals.filter(h => h.id !== id) }));
  }, [setState]);

  const updateCustomHymnal = useCallback((hymnal: Hymnal) => {
    setState(prev => {
      const exists = prev.customHymnals.some(h => h.id === hymnal.id);
      let newCustomHymnals;
      if (exists) {
        newCustomHymnals = prev.customHymnals.map(h => h.id === hymnal.id ? hymnal : h);
      } else {
        newCustomHymnals = [...prev.customHymnals, hymnal];
      }
      return { ...prev, customHymnals: newCustomHymnals };
    });
  }, [setState]);

  const addCustomSong = useCallback((song: Song) => {
    setState(prev => {
      const newCustomSongs = [...prev.customSongs, song];
      localStorage.setItem('cancionero-custom-songs', JSON.stringify(newCustomSongs));
      return { ...prev, customSongs: newCustomSongs };
    });
  }, [setState]);

  const updateCustomSong = useCallback((song: Song) => {
    setState(prev => {
      const exists = prev.customSongs.some(s => s.id === song.id);
      let newCustomSongs;
      if (exists) {
        newCustomSongs = prev.customSongs.map(s => s.id === song.id ? song : s);
      } else {
        newCustomSongs = [...prev.customSongs, song];
      }
      localStorage.setItem('cancionero-custom-songs', JSON.stringify(newCustomSongs));
      return { ...prev, customSongs: newCustomSongs };
    });
  }, [setState]);

  const removeCustomSong = useCallback((id: string) => {
    setState(prev => {
      const newCustomSongs = prev.customSongs.filter(s => s.id !== id);
      localStorage.setItem('cancionero-custom-songs', JSON.stringify(newCustomSongs));
      return { ...prev, customSongs: newCustomSongs };
    });
  }, [setState]);

  const addMultipleCustomSongs = useCallback((songs: Song[]) => {
    setState(prev => {
      const newCustomSongs = [...prev.customSongs, ...songs];
      localStorage.setItem('cancionero-custom-songs', JSON.stringify(newCustomSongs));
      return { ...prev, customSongs: newCustomSongs };
    });
  }, [setState]);

  const removeMultipleCustomSongs = useCallback((ids: string[]) => {
    setState(prev => {
      const newCustomSongs = prev.customSongs.filter(s => !ids.includes(s.id));
      localStorage.setItem('cancionero-custom-songs', JSON.stringify(newCustomSongs));
      return { ...prev, customSongs: newCustomSongs };
    });
  }, [setState]);

  const addMultipleToFavorites = useCallback((songIds: string[]) => {
    setState(prev => {
      const newFavs = [...prev.favorites];
      songIds.forEach(id => { if (!newFavs.includes(id)) newFavs.push(id); });
      return { ...prev, favorites: newFavs };
    });
  }, [setState]);

  const value = useMemo(() => ({
    state, toggleFavorite, isFavorite, addSetlist, removeSetlist,
    addSongToSetlist, removeSongFromSetlist, removeMultipleSongsFromSetlist,
    updateSetlistSong, reorderSetlist, addOrder, removeOrder, updateOrder,
    setTheme, setFontSize, setShowChords, setCapo, updatePersonalNote,
    addCustomHymnal, removeCustomHymnal, updateCustomHymnal,
    addCustomSong, updateCustomSong, removeCustomSong,
    addMultipleCustomSongs, removeMultipleCustomSongs, addMultipleToFavorites,
  }), [state, toggleFavorite, isFavorite, addSetlist, removeSetlist,
    addSongToSetlist, removeSongFromSetlist, removeMultipleSongsFromSetlist,
    updateSetlistSong, reorderSetlist, addOrder, removeOrder, updateOrder,
    setTheme, setFontSize, setShowChords, setCapo, updatePersonalNote,
    addCustomHymnal, removeCustomHymnal, updateCustomHymnal,
    addCustomSong, updateCustomSong, removeCustomSong,
    addMultipleCustomSongs, removeMultipleCustomSongs, addMultipleToFavorites]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
