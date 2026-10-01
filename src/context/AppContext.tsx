import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Song, Hymnal } from '../types';

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  addCustomSong: (song: Song) => void;
  addMultipleCustomSongs: (songs: Song[]) => void;
  updateCustomSong: (song: Song) => void;
  removeCustomSong: (id: string) => void;
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  addCustomHymnal: (hymnal: Hymnal) => void;
  updateCustomHymnal: (hymnal: Hymnal) => void;
  removeCustomHymnal: (id: string) => void;
}

const defaultState: AppState = {
  favorites: [],
  customSongs: [],
  customHymnals: [],
  preferences: {
    theme: 'dark',
    fontSize: 16,
    showChords: true,
    capo: 0,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('cancionero-state');
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('cancionero-state', JSON.stringify(state));
  }, [state]);

  const addCustomSong = (song: Song) => {
    setState(prev => ({
      ...prev,
      customSongs: [...prev.customSongs, song],
    }));
  };

  const addMultipleCustomSongs = (songs: Song[]) => {
    setState(prev => ({
      ...prev,
      customSongs: [...prev.customSongs, ...songs],
    }));
  };

  const updateCustomSong = (song: Song) => {
    setState(prev => ({
      ...prev,
      customSongs: prev.customSongs.map(s => s.id === song.id ? song : s),
    }));
  };

  const removeCustomSong = (id: string) => {
    setState(prev => ({
      ...prev,
      customSongs: prev.customSongs.filter(s => s.id !== id),
    }));
  };

  const toggleFavorite = (songId: string) => {
    setState(prev => ({
      ...prev,
      favorites: prev.favorites.includes(songId)
        ? prev.favorites.filter(id => id !== songId)
        : [...prev.favorites, songId],
    }));
  };

  const isFavorite = (songId: string) => {
    return state.favorites.includes(songId);
  };

  const addCustomHymnal = (hymnal: Hymnal) => {
    setState(prev => ({
      ...prev,
      customHymnals: [...prev.customHymnals, hymnal],
    }));
  };

  const updateCustomHymnal = (hymnal: Hymnal) => {
    setState(prev => ({
      ...prev,
      customHymnals: prev.customHymnals.map(h => h.id === hymnal.id ? hymnal : h),
    }));
  };

  const removeCustomHymnal = (id: string) => {
    setState(prev => ({
      ...prev,
      customHymnals: prev.customHymnals.filter(h => h.id !== id),
    }));
  };

  return (
    <AppContext.Provider value={{
      state,
      setState,
      addCustomSong,
      addMultipleCustomSongs,
      updateCustomSong,
      removeCustomSong,
      toggleFavorite,
      isFavorite,
      addCustomHymnal,
      updateCustomHymnal,
      removeCustomHymnal,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
