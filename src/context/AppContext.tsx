import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { AppState, Setlist, SetlistSong, Hymnal, Song, Order, UserProfile } from '../types';

interface AppContextType {
  state: AppState;
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  addSetlist: (name: string) => void;
  removeSetlist: (id: string) => void;
  addSongToSetlist: (setlistId: string, song: SetlistSong) => void;
  removeSongFromSetlist: (setlistId: string, songId: string) => void;
  addOrder: (order: Order) => void;
  removeOrder: (id: string) => void;
  updateOrder: (order: Order) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: number) => void;
  setShowChords: (show: boolean) => void;
  setCapo: (capo: number) => void;
  addCustomHymnal: (hymnal: Hymnal) => void;
  removeCustomHymnal: (id: string) => void;
  updateCustomHymnal: (hymnal: Hymnal) => void;
  addCustomSong: (song: Song) => void;
  addMultipleCustomSongs: (songs: Song[]) => void;
  updateCustomSong: (song: Song) => void;
  removeCustomSong: (id: string) => void;
  removeMultipleCustomSongs: (ids: string[]) => void;
  addMultipleToFavorites: (ids: string[]) => void;
  updateUserProfile: (profile: UserProfile) => void;
}

const defaultState: AppState = {
  favorites: [],
  setlists: [],
  orders: [],
  preferences: { theme: 'dark', fontSize: 18, showChords: true, capo: 0 },
  personalNotes: {},
  customHymnals: [],
  customSongs: [],
  userProfile: undefined,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState>(() => {
    const saved = localStorage.getItem('cancionero-ruah-state');
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('cancionero-ruah-state', JSON.stringify(state));
  }, [state]);

  // Limpieza automática de datos corruptos al cargar
  useEffect(() => {
    const validNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
                        'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];
    
    const keys = Object.keys(localStorage);
    const noteKeys = keys.filter(key => key.startsWith('song-notes-'));
    
    noteKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const note2Valid = !data.note2 || validNotes.includes(data.note2);
        const note3Valid = !data.note3 || validNotes.includes(data.note3);
        
        if (!note2Valid || !note3Valid) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const toggleFavorite = useCallback((songId: string) => {
    setState(prev => ({
      ...prev,
      favorites: prev.favorites.includes(songId) ? prev.favorites.filter(id => id !== songId) : [...prev.favorites, songId],
    }));
  }, []);

  const isFavorite = useCallback((songId: string) => state.favorites.includes(songId), [state.favorites]);

  const addSetlist = useCallback((name: string) => {
    const newSetlist: Setlist = { id: crypto.randomUUID(), name, songs: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: '' };
    setState(prev => ({ ...prev, setlists: [...prev.setlists, newSetlist] }));
  }, []);

  const removeSetlist = useCallback((id: string) => {
    setState(prev => ({ ...prev, setlists: prev.setlists.filter(s => s.id !== id) }));
  }, []);

  const addSongToSetlist = useCallback((setlistId: string, song: SetlistSong) => {
    setState(prev => ({ ...prev, setlists: prev.setlists.map(s => s.id === setlistId ? { ...s, songs: [...s.songs, song], updatedAt: new Date().toISOString() } : s) }));
  }, []);

  const removeSongFromSetlist = useCallback((setlistId: string, songId: string) => {
    setState(prev => ({ ...prev, setlists: prev.setlists.map(s => s.id === setlistId ? { ...s, songs: s.songs.filter(song => song.songId !== songId), updatedAt: new Date().toISOString() } : s) }));
  }, []);

  const addOrder = useCallback((order: Order) => {
    setState(prev => ({ ...prev, orders: [...prev.orders, order] }));
  }, []);

  const removeOrder = useCallback((id: string) => {
    setState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }));
  }, []);

  const updateOrder = useCallback((order: Order) => {
    setState(prev => ({ ...prev, orders: prev.orders.map(o => o.id === order.id ? order : o) }));
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, preferences: { ...prev.preferences, theme } }));
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    setState(prev => ({ ...prev, preferences: { ...prev.preferences, fontSize } }));
  }, []);

  const setShowChords = useCallback((showChords: boolean) => {
    setState(prev => ({ ...prev, preferences: { ...prev.preferences, showChords } }));
  }, []);

  const setCapo = useCallback((capo: number) => {
    setState(prev => ({ ...prev, preferences: { ...prev.preferences, capo } }));
  }, []);

  const addCustomHymnal = useCallback((hymnal: Hymnal) => {
    setState(prev => ({ ...prev, customHymnals: [...prev.customHymnals, hymnal] }));
  }, []);

  const removeCustomHymnal = useCallback((id: string) => {
    setState(prev => ({ ...prev, customHymnals: prev.customHymnals.filter(h => h.id !== id) }));
  }, []);

  const updateCustomHymnal = useCallback((hymnal: Hymnal) => {
    setState(prev => {
      const newCustomHymnals = prev.customHymnals.map(h => h.id === hymnal.id ? hymnal : h);
      return { ...prev, customHymnals: newCustomHymnals };
    });
  }, []);

  const addCustomSong = useCallback((song: Song) => {
    setState(prev => {
      const exists = prev.customSongs.some(s => s.id === song.id);
      if (exists) {
        const newCustomSongs = prev.customSongs.map(s => s.id === song.id ? song : s);
        return { ...prev, customSongs: newCustomSongs };
      }
      return { ...prev, customSongs: [...prev.customSongs, song] };
    });
  }, []);

  const addMultipleCustomSongs = useCallback((songs: Song[]) => {
    setState(prev => {
      const existingIds = new Set(prev.customSongs.map(s => s.id));
      const newSongs = songs.filter(s => !existingIds.has(s.id));
      return { ...prev, customSongs: [...prev.customSongs, ...newSongs] };
    });
  }, []);

  const updateCustomSong = useCallback((song: Song) => {
    setState(prev => {
      const newCustomSongs = prev.customSongs.map(s => s.id === song.id ? song : s);
      return { ...prev, customSongs: newCustomSongs };
    });
  }, []);

  const removeCustomSong = useCallback((id: string) => {
    setState(prev => ({ ...prev, customSongs: prev.customSongs.filter(s => s.id !== id) }));
  }, []);

  const removeMultipleCustomSongs = useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, customSongs: prev.customSongs.filter(s => !ids.includes(s.id)) }));
  }, []);

  const addMultipleToFavorites = useCallback((ids: string[]) => {
    setState(prev => {
      const newFavs = [...new Set([...prev.favorites, ...ids])];
      return { ...prev, favorites: newFavs };
    });
  }, []);

  const updateUserProfile = useCallback((profile: UserProfile) => {
    setState(prev => ({ ...prev, userProfile: profile }));
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, []);

  const value = useMemo(() => ({
    state, toggleFavorite, isFavorite, addSetlist, removeSetlist, addSongToSetlist, removeSongFromSetlist,
    addOrder, removeOrder, updateOrder, setTheme, setFontSize, setShowChords, setCapo,
    addCustomHymnal, removeCustomHymnal, updateCustomHymnal, addCustomSong, addMultipleCustomSongs,
    updateCustomSong, removeCustomSong, removeMultipleCustomSongs, addMultipleToFavorites, updateUserProfile,
  }), [state, toggleFavorite, isFavorite, addSetlist, removeSetlist, addSongToSetlist, removeSongFromSetlist,
    addOrder, removeOrder, updateOrder, setTheme, setFontSize, setShowChords, setCapo,
    addCustomHymnal, removeCustomHymnal, updateCustomHymnal, addCustomSong, addMultipleCustomSongs,
    updateCustomSong, removeCustomSong, removeMultipleCustomSongs, addMultipleToFavorites, updateUserProfile]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
