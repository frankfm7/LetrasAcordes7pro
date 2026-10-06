import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Song, Hymnal } from './types';
import { songs as allSongs, hymnals } from './data/songs';
import { transposeLyrics } from './utils/chords';
import { Moon, Sun, Home, Search, Star, ListMusic, Music, Settings, Plus, Heart, ChevronLeft, ChevronRight, MoreVertical, CheckSquare, Square, Edit3, Trash2, RotateCcw, Play, Pause, Copy, Share2, Download, Upload, Camera, User, ChevronDown, FileText, File, FileJson, Image as ImageIcon } from 'lucide-react';

export default function App() {
  return <AppProvider><AppContent /></AppProvider>;
}

function AppContent() {
  const { state, setTheme } = useApp();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedHymnal, setSelectedHymnal] = useState<Hymnal | null>(null);

  useEffect(() => {
    document.documentElement.className = state.preferences.theme;
  }, [state.preferences.theme]);

  const handleSelectSong = useCallback((song: Song) => setSelectedSong(song), []);
  const handleSelectHymnal = useCallback((hymnal: Hymnal) => setSelectedHymnal(hymnal), []);
  const handleBack = useCallback(() => {
    if (selectedSong) setSelectedSong(null);
    else if (selectedHymnal) setSelectedHymnal(null);
    else setCurrentPage('home');
  }, [selectedSong, selectedHymnal]);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
    setSelectedSong(null);
    setSelectedHymnal(null);
  }, []);

  if (selectedSong) {
    return <SongView song={selectedSong} onBack={handleBack} />;
  }

  if (selectedHymnal) {
    return <HymnalView hymnal={selectedHymnal} onSelectSong={handleSelectSong} onBack={handleBack} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} />;
      case 'search': return <SearchPage onSelectSong={handleSelectSong} />;
      case 'favorites': return <FavoritesPage onSelectSong={handleSelectSong} />;
      default: return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>C7</div>
            <div>
              <h1 className="text-sm sm:text-lg font-bold leading-tight" style={{ color: 'var(--accent)' }}>Cancionero<span className="font-black">7Pro</span></h1>
              <p className="text-[9px] sm:text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>Letras y Acordes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleNavigate('search')} className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><Search size={18} /></button>
            <button onClick={() => setTheme(state.preferences.theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{state.preferences.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">{renderPage()}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto flex">
          {[{ id: 'home', label: 'Inicio', icon: Home }, { id: 'search', label: 'Buscar', icon: Search }, { id: 'favorites', label: 'Favoritos', icon: Heart }].map(item => {
            const isActive = currentPage === item.id;
            return (<button key={item.id} onClick={() => handleNavigate(item.id)} className={`flex-1 flex flex-col items-center py-3 px-1 transition-all ${isActive ? 'scale-105' : 'opacity-60'}`} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}><item.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} /><span className="text-[9px] font-semibold mt-1">{item.label}</span></button>);
          })}
        </div>
      </nav>
    </div>
  );
}

function HomePage({ onSelectSong, onSelectHymnal }: any) {
  const { state } = useApp();
  const allAvailableSongs = useMemo(() => [...allSongs, ...state.customSongs], [state.customSongs]);
  const allHymnals = useMemo(() => [...hymnals, ...state.customHymnals], [state.customHymnals]);

  return (
    <div className="space-y-6 pb-4">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><span>📚</span> Cancioneros</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {allHymnals.map((hymnal) => {
            const hymnalSongs = allAvailableSongs.filter(s => s.hymnalId === hymnal.id);
            return (
              <div key={hymnal.id} className="relative group">
                <div className="rounded-2xl relative overflow-hidden p-3 sm:p-5 flex flex-col justify-between text-left transition-all hover-lift active:scale-[0.97] w-full cursor-pointer" style={{ aspectRatio: '3/4', background: `linear-gradient(135deg, ${hymnal.color}, ${hymnal.color}cc)`, boxShadow: `0 8px 24px ${hymnal.color}44, 0 2px 8px rgba(0,0,0,0.1)` }} onClick={() => onSelectHymnal(hymnal)}>
                  <div><div className="text-3xl sm:text-4xl mb-2 sm:mb-3 drop-shadow-lg">{hymnal.icon}</div><div className="text-white font-bold text-sm sm:text-xl leading-tight mb-1 sm:mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>{hymnal.name}</div></div>
                  <div><div className="text-white/95 text-xs sm:text-base font-semibold" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}>{hymnalSongs.length} canciones</div><div className="text-white/80 text-[10px] sm:text-xs" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{hymnal.language}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function HymnalView({ hymnal, onSelectSong, onBack }: any) {
  const { state, toggleFavorite, isFavorite } = useApp();

  const hymnalSongs = useMemo(() => {
    return [...allSongs, ...state.customSongs].filter(s => s.hymnalId === hymnal.id);
  }, [hymnal.id, state.customSongs]);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: hymnal.color + '20' }}>{hymnal.icon}</div>
        <div className="flex-1"><h2 className="text-lg font-bold">{hymnal.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hymnalSongs.length} canciones • {hymnal.language}</p></div>
      </div>
      <div className="space-y-2">
        {hymnalSongs.map(song => (
          <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <button onClick={() => onSelectSong(song)} className="flex-1 text-left">
              <div className="flex items-center gap-2"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{song.code}</span><span className="font-medium text-sm">{song.title}</span></div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key}</div>
            </button>
            <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-lg" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={18} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchPage({ onSelectSong }: any) {
  const { state, toggleFavorite, isFavorite } = useApp();
  const [query, setQuery] = useState('');
  const allAvailableSongs = useMemo(() => [...allSongs, ...state.customSongs], [state.customSongs]);
  const filteredSongs = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allAvailableSongs.filter(song => song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q));
  }, [query, allAvailableSongs]);

  return (
    <div className="space-y-4 pb-4">
      <div><h2 className="text-2xl font-bold mb-1">Buscar</h2></div>
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar canciones..." className="w-full pl-12 pr-12 py-4 rounded-2xl border text-base font-medium" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} autoFocus />
      </div>
      <div className="space-y-2">
        {filteredSongs.map((song) => (
          <div key={song.id} className="flex items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <button onClick={() => onSelectSong(song)} className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono px-2 py-0.5 rounded-lg font-bold" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>{song.code}</span><span className="font-bold text-base">{song.title}</span></div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{song.artist}</div>
            </button>
            <button onClick={() => toggleFavorite(song.id)} className="p-2.5 rounded-xl" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={20} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FavoritesPage({ onSelectSong }: any) {
  const { state, toggleFavorite } = useApp();
  const favoriteSongs = useMemo(() => [...allSongs, ...state.customSongs].filter(s => state.favorites.includes(s.id)), [state.favorites, state.customSongs]);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2"><span className="text-2xl">⭐</span><div><h2 className="text-lg font-bold">Mis Favoritos</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{favoriteSongs.length} canciones</p></div></div>
      {favoriteSongs.length > 0 ? (
        <div className="space-y-2">
          {favoriteSongs.map(song => (
            <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <button onClick={() => onSelectSong(song)} className="flex-1 text-left">
                <div className="flex items-center gap-2"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{song.code}</span><span className="font-medium text-sm">{song.title}</span></div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist}</div>
              </button>
              <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-lg" style={{ color: 'var(--gold)' }}><Star size={18} fill="currentColor" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12"><Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aún no tienes favoritos</p></div>
      )}
    </div>
  );
}

function SongView({ song, onBack }: any) {
  const { state, toggleFavorite, isFavorite, setFontSize, setShowChords, setCapo } = useApp();
  const [transposition, setTransposition] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const { preferences } = state;

  const transposedLyrics = useMemo(() => {
    let lyrics = song.lyrics;
    if (preferences.capo > 0) lyrics = transposeLyrics(lyrics, -preferences.capo);
    if (transposition !== 0) lyrics = transposeLyrics(lyrics, transposition);
    return lyrics;
  }, [song.lyrics, transposition, preferences.capo]);

  const renderLyrics = () => {
    const lines = transposedLyrics.split('\n');
    const elements: JSX.Element[] = [];
    let lineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; const trimmed = line.trim();
      if (trimmed === '') { elements.push(<div key={lineIndex++} className="h-4" />); continue; }
      const sectionMatch = trimmed.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL|PRE-CORO|PRE CORO|OUTRO|BRIDGE)\s*(\d*)/i);
      if (sectionMatch && !trimmed.includes('//')) {
        const type = sectionMatch[1].toUpperCase();
        const sectionColors: Record<string, string> = { 'VERSO': '#7c3aed', 'CORO': '#f59e0b', 'PUENTE': '#059669', 'INTRO': '#6366f1', 'FINAL': '#ef4444', 'PRE-CORO': '#ec4899', 'PRE CORO': '#ec4899', 'OUTRO': '#0891b2', 'BRIDGE': '#059669' };
        const color = sectionColors[type] || 'var(--accent)';
        elements.push(<div key={lineIndex++} className="mt-8 mb-3"><span className="text-sm font-black uppercase tracking-widest px-3 py-1.5 rounded-lg inline-block" style={{ color, backgroundColor: color + '20' }}>{trimmed}</span></div>);
        continue;
      }
      if (trimmed.startsWith('//')) {
        const chordLine = trimmed.substring(2).trim();
        if (i + 1 < lines.length && lines[i + 1].trim() !== '' && !lines[i + 1].trim().startsWith('//')) {
          const lyricLine = lines[i + 1]; i++;
          elements.push(<div key={lineIndex++} className="mb-3">{preferences.showChords && <div className="font-mono mb-0.5 whitespace-pre" style={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.05em', fontSize: `${preferences.fontSize * 0.75}px` }} translate="no">{chordLine}</div>}<div className="font-lyrics leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${preferences.fontSize}px` }}>{lyricLine}</div></div>);
        } else { elements.push(<div key={lineIndex++} className="mb-2">{preferences.showChords && <div className="font-mono whitespace-pre" style={{ color: 'var(--accent)', fontWeight: 800, fontSize: `${preferences.fontSize * 0.75}px` }} translate="no">{chordLine}</div>}</div>); }
        continue;
      }
      elements.push(<div key={lineIndex++} className="mb-3"><div className="font-lyrics leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${preferences.fontSize}px` }}>{line}</div></div>);
    }
    return elements;
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-shrink-0 flex items-center gap-2 mb-2">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">{song.title}</h1>
          <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
            <span>{song.artist}</span>
            <span>•</span>
            <span className="font-bold" style={{ color: 'var(--accent)' }} translate="no">{song.key}</span>
            <span translate="no">{song.timeSignature}</span>
            <span translate="no">{song.bpm} BPM</span>
          </div>
        </div>
        <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-xl" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={20} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
        <button onClick={() => setShowConfig(!showConfig)} className="p-2 rounded-xl" style={{ backgroundColor: showConfig ? 'var(--accent-light)' : 'var(--bg-tertiary)', color: showConfig ? 'var(--accent)' : 'var(--text-primary)' }}><Settings size={18} /></button>
      </div>

      {showConfig && (
        <div className="flex-shrink-0 rounded-2xl border p-4 space-y-4 mb-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }} translate="no">
          <div><span className="text-sm font-semibold mb-2 block">Tamaño de Letra</span><div className="flex items-center gap-3"><span className="text-xs">A</span><input type="range" min="14" max="40" value={preferences.fontSize} onChange={e => setFontSize(Number(e.target.value))} className="flex-1 accent-purple-600" /><span className="text-xl font-bold">A</span><span className="text-xs w-10 text-right">{preferences.fontSize}px</span></div></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Mostrar Acordes</span><button onClick={() => setShowChords(!preferences.showChords)} className="w-12 h-7 rounded-full transition-all relative" style={{ backgroundColor: preferences.showChords ? 'var(--accent)' : 'var(--bg-tertiary)' }}><div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all" style={{ left: preferences.showChords ? '26px' : '4px' }} /></button></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="p-5 md:p-8" translate="no">{renderLyrics()}</div>
      </div>
    </div>
  );
}
