import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { NotificationProvider, useNotification } from './NotificationProvider';
import { Song, Hymnal, Order, OrderItem } from '../types';
import { songs as allSongs, hymnals, generateSongCode, getNextSongNumber } from '../data/songs';
import { transposeLyrics } from '../utils/chords';
import { generateSongShareText } from '../utils/shareUtils';
import { Moon, Sun, Menu, X, Home, Search, Star, ListMusic, Music, Settings, Download, Upload, Plus, Heart, ChevronLeft, ChevronRight, Copy, Share2, Edit3, Trash2, RotateCcw, Play, Pause, MoreVertical, Filter, CheckSquare, Square, ArrowRight, Image, Camera, Save } from 'lucide-react';
import SplashScreen from './SplashScreen';
import Metronome from './Metronome';
import Tuner from './Tuner';
import SongEditor from './SongEditor';
import AddHymnalModal from './AddHymnalModal';
import EditHymnalModal from './EditHymnalModal';

export default function App() {
  return (
    <NotificationProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </NotificationProvider>
  );
}

function AppContent() {
  const { state, setTheme, updateCustomHymnal } = useApp();
  const { showNotification } = useNotification();
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedHymnal, setSelectedHymnal] = useState<Hymnal | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showEditHymnalModal, setShowEditHymnalModal] = useState(false);
  const [editingHymnal, setEditingHymnal] = useState<Hymnal | null>(null);
  const [showAddHymnalModal, setShowAddHymnalModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [addingSongToHymnal, setAddingSongToHymnal] = useState<Hymnal | null>(null);

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
    setSidebarOpen(false);
    setEditingSong(null);
  }, []);

  const handleExport = useCallback(() => {
    try {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cancionero7pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('Respaldo exportado', 'success');
    } catch {
      showNotification('Error al exportar', 'error');
    }
  }, [state, showNotification]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.favorites && data.setlists) {
            localStorage.setItem('cancionero-ruah-state', JSON.stringify(data));
            showNotification('Respaldo restaurado', 'success');
            window.location.reload();
          } else showNotification('Archivo inválido', 'error');
        } catch {
          showNotification('Error al importar', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showNotification]);



  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  if (editingSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport}>
        <SongEditor song={editingSong} onBack={() => setEditingSong(null)} />
      </Layout>
    );
  }

  if (selectedSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport}>
        <SongView song={selectedSong} onBack={handleBack} onEdit={() => setEditingSong(selectedSong)} showNotification={showNotification} />
      </Layout>
    );
  }

  if (addingSongToHymnal) {
    const nextNumber = getNextSongNumber(addingSongToHymnal.id, [...allSongs, ...state.customSongs]);
    const code = generateSongCode(addingSongToHymnal, nextNumber);
    const newSong: Song = {
      id: `new-${Date.now()}`,
      title: '',
      artist: '',
      code,
      number: nextNumber,
      hymnalId: addingSongToHymnal.id,
      key: 'C',
      timeSignature: '4/4',
      bpm: 120,
      language: addingSongToHymnal.language.split('/')[0],
      categories: [],
      sections: [],
      lyrics: '',
      notes: '',
    };
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport}>
        <SongEditor song={newSong} onBack={() => setAddingSongToHymnal(null)} />
      </Layout>
    );
  }

  if (selectedHymnal) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport}>
        <HymnalView hymnal={selectedHymnal} onSelectSong={handleSelectSong} onBack={handleBack} onEditHymnal={(h: Hymnal) => { setEditingHymnal(h); setShowEditHymnalModal(true); }} onAddSong={(h: Hymnal) => setAddingSongToHymnal(h)} />
      </Layout>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} onEditHymnal={(h: Hymnal) => { setEditingHymnal(h); setShowEditHymnalModal(true); }} />;
      case 'search': return <SearchPage onSelectSong={handleSelectSong} />;
      case 'favorites': return <FavoritesPage onSelectSong={handleSelectSong} />;
      case 'setlists': return <SetlistsPage onSelectSong={handleSelectSong} showNotification={showNotification} />;
      case 'orders': return <OrdersPage onSelectSong={handleSelectSong} showNotification={showNotification} />;
      case 'tools': return <ToolsPage />;
      default: return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} onEditHymnal={(h: Hymnal) => { setEditingHymnal(h); setShowEditHymnalModal(true); }} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport}>
      {renderPage()}
      {showEditHymnalModal && editingHymnal && (
        <EditHymnalModal hymnal={editingHymnal} onClose={() => { setShowEditHymnalModal(false); setEditingHymnal(null); }} onSave={(h) => { updateCustomHymnal(h); setShowEditHymnalModal(false); setEditingHymnal(null); showNotification('Cancionero actualizado', 'success'); }} />
      )}
      {showAddHymnalModal && (
        <AddHymnalModal onClose={() => setShowAddHymnalModal(false)} />
      )}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowExportModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Exportar Respaldo</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Se exportarán todas tus canciones, favoritos y listas.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowExportModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
              <button onClick={() => { handleExport(); setShowExportModal(false); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Exportar</button>
            </div>
          </div>
        </div>
      )}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowImportModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Importar Respaldo</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>⚠️ Esto reemplazará todos tus datos actuales.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowImportModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
              <button onClick={() => { handleImport(); setShowImportModal(false); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Importar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Layout({ children, currentPage, onNavigate, sidebarOpen, setSidebarOpen, onImport, onExport }: any) {
  const { state, setTheme } = useApp();
  const menuItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'favorites', label: 'Favoritos', icon: Star },
    { id: 'setlists', label: 'Listas', icon: ListMusic },
    { id: 'orders', label: 'Órdenes', icon: Music },
    { id: 'tools', label: 'Tools', icon: Settings },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      {sidebarOpen && (
        <aside className="fixed left-0 top-0 bottom-0 z-50 w-80 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)' }}>
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>7</div>
                <div><h1 className="font-bold text-lg" style={{ color: 'var(--accent)' }}>Cancionero<span className="font-black">7Pro</span></h1><p className="text-xs" style={{ color: 'var(--text-muted)' }}>v1.0 Premium</p></div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{state.favorites.length}</div><div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Favoritos</div></div>
              <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{state.setlists.length}</div><div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Listas</div></div>
              <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{state.customSongs.length + allSongs.length}</div><div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Canciones</div></div>
            </div>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--text-muted)' }}>Navegación</p>
            {menuItems.map(item => (
              <button key={item.id} onClick={() => onNavigate(item.id)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all" style={{ backgroundColor: currentPage === item.id ? 'var(--accent-light)' : 'transparent', color: currentPage === item.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                <item.icon size={20} /><span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--text-muted)' }}>Datos</p>
              <button onClick={() => { onExport(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all" style={{ color: 'var(--text-primary)' }}>
                <Download size={20} /><span className="font-medium text-sm">Exportar Respaldo</span>
              </button>
              <button onClick={() => { onImport(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all" style={{ color: 'var(--text-primary)' }}>
                <Upload size={20} /><span className="font-medium text-sm">Importar Respaldo</span>
              </button>
            </div>
          </nav>
          <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button onClick={() => setTheme(state.preferences.theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              {state.preferences.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}Modo {state.preferences.theme === 'dark' ? 'Claro' : 'Oscuro'}
            </button>
          </div>
        </aside>
      )}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><Menu size={20} /></button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>C7</div>
              <div><h1 className="text-sm sm:text-lg font-bold leading-tight" style={{ color: 'var(--accent)' }}>Cancionero<span className="font-black">7Pro</span></h1><p className="text-[9px] sm:text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>Gestión Profesional</p></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('search')} className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><Search size={18} /></button>
            <button onClick={() => setTheme(state.preferences.theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{state.preferences.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-4rem-4rem)] overflow-y-auto">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto flex">
          {[{ id: 'home', label: 'Inicio', icon: Home }, { id: 'search', label: 'Buscar', icon: Search }, { id: 'favorites', label: 'Favoritos', icon: Heart }, { id: 'setlists', label: 'Listas', icon: ListMusic }, { id: 'orders', label: 'Órdenes', icon: Music }, { id: 'tools', label: 'Tools', icon: Settings }].map(item => {
            const isActive = currentPage === item.id;
            return (<button key={item.id} onClick={() => onNavigate(item.id)} className={`flex-1 flex flex-col items-center py-3 px-1 transition-all ${isActive ? 'scale-105' : 'opacity-60'}`} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}><item.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} /><span className="text-[9px] font-semibold mt-1">{item.label}</span>{isActive && <div className="absolute top-0 w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />}</button>);
          })}
        </div>
      </nav>
    </div>
  );
}

function HomePage({ onSelectSong, onSelectHymnal, onSearch, onAddHymnal, onEditHymnal }: any) {
  const { state, toggleFavorite, isFavorite } = useApp();
  const allAvailableSongs = useMemo(() => [...allSongs, ...state.customSongs], [state.customSongs]);
  const allHymnals = useMemo(() => [...hymnals, ...state.customHymnals], [state.customHymnals]);
  const featuredSongs = allAvailableSongs.slice(0, 6);

  return (
    <div className="space-y-6 pb-4">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><span>📚</span> Cancioneros</h2>
          <button onClick={onAddHymnal} className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 card-shadow-md hover:card-shadow-lg transition-all" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={14} /> Nuevo</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {allHymnals.map((hymnal) => {
            const hymnalSongs = allAvailableSongs.filter(s => s.hymnalId === hymnal.id);
            return (
              <div key={hymnal.id} className="relative group">
                <button onClick={() => onSelectHymnal(hymnal)} className="rounded-2xl relative overflow-hidden p-3 sm:p-5 flex flex-col justify-between text-left transition-all hover-lift active:scale-[0.97] w-full" style={{ aspectRatio: '3/4', background: `linear-gradient(135deg, ${hymnal.color}, ${hymnal.color}cc)`, boxShadow: `0 8px 24px ${hymnal.color}44, 0 2px 8px rgba(0,0,0,0.1)` }}>
                  <div><div className="text-4xl sm:text-6xl mb-2 sm:mb-4 drop-shadow-lg">{hymnal.icon}</div><div className="text-white font-bold text-sm sm:text-xl leading-tight mb-1 sm:mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>{hymnal.name}</div></div>
                  <div><div className="text-white/95 text-xs sm:text-base font-semibold" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}>{hymnalSongs.length} canciones</div><div className="text-white/80 text-[10px] sm:text-xs" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{hymnal.language}</div></div>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onEditHymnal(hymnal); }} className="absolute top-2 right-2 p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 card-shadow-md">
                  <Edit3 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">🎵 Destacadas</h2>
          <button onClick={onSearch} className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-opacity-10 transition-all" style={{ color: 'var(--accent)' }}>Ver todas →</button>
        </div>
        <div className="space-y-3">
          {featuredSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-3 p-4 rounded-2xl border card-shadow-sm hover:card-shadow-md transition-all hover-lift" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <button onClick={() => onSelectSong(song)} className="flex-1 text-left flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold card-shadow-sm" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>{song.code.charAt(0)}</div>
                <div className="flex-1 min-w-0"><div className="font-semibold text-base truncate">{song.title}</div><div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature}</div></div>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
              <button onClick={() => toggleFavorite(song.id)} className="p-2.5 rounded-xl hover:scale-110 transition-transform" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={20} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SongView({ song: initialSong, onBack, onEdit, showNotification }: any) {
  const { state, toggleFavorite, isFavorite, setFontSize, setShowChords, setCapo, addSongToSetlist } = useApp();
  const [transposition, setTransposition] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [currentLanguage, setCurrentLanguage] = useState<string>(initialSong.language.split('/')[0]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  const song = useMemo(() => {
    const customSong = state.customSongs.find(s => s.id === initialSong.id);
    return customSong || initialSong;
  }, [initialSong, state.customSongs]);
  const { preferences } = state;

  const transposedLyrics = useMemo(() => {
    let lyrics = song.lyricsByLanguage?.[currentLanguage] || song.lyrics;
    if (preferences.capo > 0) lyrics = transposeLyrics(lyrics, -preferences.capo);
    if (transposition !== 0) lyrics = transposeLyrics(lyrics, transposition);
    return lyrics;
  }, [song.lyrics, song.lyricsByLanguage, currentLanguage, transposition, preferences.capo]);

  const sections = useMemo(() => {
    const lines = transposedLyrics.split('\n');
    const sectionList: { id: string; label: string; type: string }[] = [];
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      const sectionMatch = trimmed.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL|PRE-CORO|PRE CORO|OUTRO|BRIDGE)\s*(\d*)/i);
      if (sectionMatch && !trimmed.includes('//')) {
        const type = sectionMatch[1].toUpperCase();
        const num = sectionMatch[2] || '';
        const id = `${type}${num}`.toLowerCase();
        const label = num ? `${type.charAt(0)}${num}` : type.charAt(0);
        sectionList.push({ id, label: label.toUpperCase(), type });
      }
    });
    return sectionList;
  }, [transposedLyrics]);

  useEffect(() => {
    if (isAutoScrolling && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      scrollIntervalRef.current = window.setInterval(() => { container.scrollTop += scrollSpeed / 20; }, 50);
    } else { if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null; } }
    return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); };
  }, [isAutoScrolling, scrollSpeed]);

  const scrollToSection = (sectionId: string) => {
    if (scrollContainerRef.current) {
      const element = scrollContainerRef.current.querySelector(`[data-section="${sectionId}"]`);
      if (element) {
        const container = scrollContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = (element as HTMLElement).getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
        container.scrollTo({ top: relativeTop - 80, behavior: 'smooth' });
      }
    }
  };

  const copyLyrics = () => {
    const cleanLyrics = transposedLyrics.replace(/\/\/[^\n]*\n/g, '').replace(/\n{3,}/g, '\n\n').trim();
    navigator.clipboard.writeText(cleanLyrics);
    showNotification('Letra copiada', 'success');
  };

  const shareSong = () => {
    const text = generateSongShareText(song);
    if (navigator.share) navigator.share({ title: song.title, text });
    else { navigator.clipboard.writeText(text); showNotification('Copiado', 'success'); }
  };

  const renderLyrics = () => {
    const lines = transposedLyrics.split('\n');
    const elements: JSX.Element[] = [];
    let lineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; const trimmed = line.trim();
      if (trimmed === '') { elements.push(<div key={lineIndex++} className="h-4" />); continue; }
      const sectionMatch = trimmed.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL|PRE-CORO|PRE CORO|OUTRO|BRIDGE)\s*(\d*)/i);
      if (sectionMatch && !trimmed.includes('//')) {
        const type = sectionMatch[1].toUpperCase(); const num = sectionMatch[2] || '';
        const sectionId = `${type}${num}`.toLowerCase();
        const sectionColors: Record<string, string> = { 'VERSO': '#7c3aed', 'CORO': '#f59e0b', 'PUENTE': '#059669', 'INTRO': '#6366f1', 'FINAL': '#ef4444', 'PRE-CORO': '#ec4899', 'PRE CORO': '#ec4899', 'OUTRO': '#0891b2', 'BRIDGE': '#059669' };
        const color = sectionColors[type] || 'var(--accent)';
        elements.push(<div key={lineIndex++} data-section={sectionId} className="mt-8 mb-3"><span className="text-sm font-black uppercase tracking-widest px-3 py-1.5 rounded-lg inline-block" style={{ color, backgroundColor: color + '20' }}>{trimmed}</span></div>);
        continue;
      }
      if (trimmed.startsWith('//')) {
        const chordLine = trimmed.substring(2).trim();
        if (i + 1 < lines.length && lines[i + 1].trim() !== '' && !lines[i + 1].trim().startsWith('//')) {
          const lyricLine = lines[i + 1]; i++;
          elements.push(<div key={lineIndex++} className="mb-4">{preferences.showChords && <div className="font-mono text-sm mb-1 whitespace-pre" style={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.05em' }}>{chordLine}</div>}<div className="font-lyrics leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${preferences.fontSize}px` }}>{lyricLine}</div></div>);
        } else { elements.push(<div key={lineIndex++} className="mb-2">{preferences.showChords && <div className="font-mono text-sm whitespace-pre" style={{ color: 'var(--accent)', fontWeight: 800 }}>{chordLine}</div>}</div>); }
        continue;
      }
      elements.push(<div key={lineIndex++} className="mb-4"><div className="font-lyrics leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${preferences.fontSize}px` }}>{line}</div></div>);
    }
    return elements;
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-shrink-0 flex items-center gap-2 mb-2">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={18} /></button>
        <div className="flex-1 min-w-0"><h1 className="text-base font-bold truncate">{song.title}</h1><div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}><span>{song.artist}</span><span>•</span><span className="font-bold" style={{ color: 'var(--accent)' }}>{song.key}</span><span>{song.timeSignature}</span><span>{song.bpm} BPM</span></div></div>
        <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-xl" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={20} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
        {song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1 && (
          <button onClick={() => { const languages = Object.keys(song.lyricsByLanguage!); const idx = languages.indexOf(currentLanguage); setCurrentLanguage(languages[(idx + 1) % languages.length]); }} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{currentLanguage}</button>
        )}
        <button onClick={() => setShowConfig(!showConfig)} className="p-2 rounded-xl" style={{ backgroundColor: showConfig ? 'var(--accent-light)' : 'var(--bg-tertiary)', color: showConfig ? 'var(--accent)' : 'var(--text-primary)' }}><Settings size={18} /></button>
        <div className="relative" data-menu>
          <button onClick={(e) => { e.stopPropagation(); setShowActionsMenu(!showActionsMenu); }} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><MoreVertical size={18} /></button>
          {showActionsMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <button onClick={() => { onEdit(); setShowActionsMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}><Edit3 size={14} /> Editar</button>
              <button onClick={() => { copyLyrics(); setShowActionsMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}><Copy size={14} /> Copiar Letra</button>
              <button onClick={() => { shareSong(); setShowActionsMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}><Share2 size={14} /> Compartir</button>
              <button onClick={() => { setShowAddToList(true); setShowActionsMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--accent)' }}><ListMusic size={14} /> Agregar a Lista</button>
            </div>
          )}
        </div>
      </div>

      {showConfig && (
        <div className="flex-shrink-0 rounded-2xl border p-4 space-y-4 mb-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div>
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">Transposición</span>{transposition !== 0 && <button onClick={() => setTransposition(0)} className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}><RotateCcw size={12} /> Original</button>}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTransposition(t => t - 1)} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>−</button>
              <div className="flex-1 text-center"><span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{transposition > 0 ? `+${transposition}` : transposition}</span><span className="text-xs block" style={{ color: 'var(--text-muted)' }}>semitonos</span></div>
              <button onClick={() => setTransposition(t => t + 1)} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>+</button>
            </div>
          </div>
          <div><span className="text-sm font-semibold mb-2 block">Tamaño de Letra</span><div className="flex items-center gap-3"><span className="text-xs">A</span><input type="range" min="14" max="32" value={preferences.fontSize} onChange={e => setFontSize(Number(e.target.value))} className="flex-1 accent-purple-600" /><span className="text-xl font-bold">A</span><span className="text-xs w-10 text-right">{preferences.fontSize}px</span></div></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Mostrar Acordes</span><button onClick={() => setShowChords(!preferences.showChords)} className="w-12 h-7 rounded-full transition-all relative" style={{ backgroundColor: preferences.showChords ? 'var(--accent)' : 'var(--bg-tertiary)' }}><div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all" style={{ left: preferences.showChords ? '26px' : '4px' }} /></button></div>
          <div><span className="text-sm font-semibold mb-2 block">Capo de Guitarra</span><div className="flex items-center gap-2"><button onClick={() => setCapo(Math.max(0, preferences.capo - 1))} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>−</button><div className="flex-1 text-center"><span className="text-2xl font-bold">{preferences.capo > 0 ? `${preferences.capo}°` : '—'}</span><span className="text-xs block" style={{ color: 'var(--text-muted)' }}>traste</span></div><button onClick={() => setCapo(Math.min(12, preferences.capo + 1))} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>+</button></div></div>
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
        {sections.length > 0 && (
          <div className="sticky top-0 z-20 py-2 px-3 border-b shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <div className="flex gap-1.5 overflow-x-auto">
              {sections.map((section, idx) => {
                const sectionColors: Record<string, string> = { 'VERSO': '#7c3aed', 'CORO': '#f59e0b', 'PUENTE': '#059669', 'INTRO': '#6366f1', 'FINAL': '#ef4444', 'PRE-CORO': '#ec4899', 'PRE CORO': '#ec4899', 'OUTRO': '#0891b2', 'BRIDGE': '#059669' };
                const color = sectionColors[section.type] || 'var(--accent)';
                return (<button key={idx} onClick={() => scrollToSection(section.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 flex-shrink-0" style={{ backgroundColor: color + '20', color }}>{section.label}</button>);
              })}
            </div>
          </div>
        )}
        <div className="p-5 md:p-8">{renderLyrics()}</div>
      </div>

      <div className="fixed bottom-24 right-4 z-30 flex flex-col items-center gap-2">
        {isAutoScrolling && (
          <div className="rounded-xl p-2 flex flex-col items-center" style={{ backgroundColor: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(5px)' }}>
            <input type="range" min="10" max="200" step="10" value={scrollSpeed} onChange={e => setScrollSpeed(Number(e.target.value))} className="accent-purple-400" style={{ writingMode: 'vertical-lr' as any, direction: 'rtl', height: '80px', width: '24px' }} />
            <div className="text-[10px] font-bold mt-1 text-white/90">{scrollSpeed}</div>
          </div>
        )}
        <button onClick={() => setIsAutoScrolling(!isAutoScrolling)} className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95" style={{ backgroundColor: isAutoScrolling ? 'rgba(239,68,68,0.85)' : 'rgba(124,58,237,0.85)', color: 'white' }}>{isAutoScrolling ? <Pause size={24} /> : <Play size={24} className="ml-1" />}</button>
      </div>

      {showAddToList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAddToList(false)}>
          <div className="w-full max-w-md rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Agregar a Lista</h3>
            {state.setlists.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No tienes listas</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {state.setlists.map(setlist => (
                  <button key={setlist.id} onClick={() => { addSongToSetlist(setlist.id, { songId: song.id, transposition: 0, notes: '', order: setlist.songs.length }); setShowAddToList(false); showNotification('Agregada a la lista', 'success'); }} className="w-full text-left p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="font-medium text-sm">{setlist.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{setlist.songs.length} canciones</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HymnalView({ hymnal, onSelectSong, onBack, onEditHymnal, onAddSong }: any) {
  const { state, toggleFavorite, isFavorite } = useApp();

  const hymnalSongs = useMemo(() => {
    return [...allSongs, ...state.customSongs].filter(s => s.hymnalId === hymnal.id);
  }, [hymnal.id, state.customSongs]);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg card-shadow-sm hover:card-shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl card-shadow-lg" style={{ backgroundColor: hymnal.color + '20' }}>{hymnal.icon}</div>
        <div className="flex-1"><h2 className="text-lg font-bold">{hymnal.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hymnalSongs.length} canciones • {hymnal.language}</p></div>
        <button onClick={() => onEditHymnal(hymnal)} className="p-2.5 rounded-xl card-shadow-sm hover:card-shadow-md transition-all" style={{ backgroundColor: 'var(--bg-tertiary)' }}><Edit3 size={18} /></button>
        <button onClick={() => onAddSong(hymnal)} className="p-2.5 rounded-xl card-shadow-md hover:card-shadow-lg transition-all" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={18} /></button>
      </div>
      <div className="space-y-2">
        {hymnalSongs.map(song => (
          <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl border card-shadow-sm hover:card-shadow-md transition-all hover-lift" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <button onClick={() => onSelectSong(song)} className="flex-1 text-left">
              <div className="flex items-center gap-2"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{song.code}</span><span className="font-medium text-sm">{song.title}</span></div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM</div>
            </button>
            <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-lg" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={18} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
          </div>
        ))}
        {hymnalSongs.length === 0 && <div className="text-center py-12"><Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay canciones</p></div>}
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
    return allAvailableSongs.filter(song => song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q) || song.code.toLowerCase().includes(q) || song.lyrics.toLowerCase().includes(q));
  }, [query, allAvailableSongs]);

  return (
    <div className="space-y-4 pb-4">
      <div><h2 className="text-2xl font-bold mb-1">Buscar</h2><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Busca por título, artista, código o letra</p></div>
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar canciones..." className="w-full pl-12 pr-12 py-4 rounded-2xl border text-base font-medium" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', boxShadow: 'var(--card-shadow)' }} autoFocus />
        {query && <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={16} /></button>}
      </div>
      <div>
        <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>{filteredSongs.length} resultado{filteredSongs.length !== 1 ? 's' : ''}</div>
        <div className="space-y-2">
          {filteredSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <button onClick={() => onSelectSong(song)} className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono px-2 py-0.5 rounded-lg font-bold" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>{song.code}</span><span className="font-bold text-base">{song.title}</span></div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM</div>
              </button>
              <button onClick={() => toggleFavorite(song.id)} className="p-2.5 rounded-xl" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={20} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
            </div>
          ))}
        </div>
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
            <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <button onClick={() => onSelectSong(song)} className="flex-1 text-left">
                <div className="flex items-center gap-2"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{song.code}</span><span className="font-medium text-sm">{song.title}</span></div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.language}</div>
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

function SetlistsPage({ onSelectSong, showNotification }: any) {
  const { state, addSetlist, removeSetlist, removeSongFromSetlist } = useApp();
  const [selectedSetlist, setSelectedSetlist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');
  const allAvailableSongs = useMemo(() => [...allSongs, ...state.customSongs], [state.customSongs]);
  const currentSetlist = state.setlists.find(s => s.id === selectedSetlist);

  const createSetlist = () => {
    if (newSetlistName.trim()) { addSetlist(newSetlistName.trim()); setNewSetlistName(''); setShowCreateModal(false); showNotification('Lista creada', 'success'); }
  };

  if (selectedSetlist && currentSetlist) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedSetlist(null)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
          <div className="flex-1"><h2 className="text-xl font-bold">{currentSetlist.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentSetlist.songs.length} canciones</p></div>
        </div>
        {currentSetlist.songs.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay canciones</p></div>
        ) : (
          <div className="space-y-2">
            {currentSetlist.songs.map((item, index) => {
              const song = allAvailableSongs.find(s => s.id === item.songId);
              return (
                <div key={item.songId} className="rounded-2xl border p-3 flex items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                  <span className="text-xs font-bold w-5" style={{ color: 'var(--accent)' }}>{index + 1}.</span>
                  <button onClick={() => song && onSelectSong(song)} className="flex-1 text-left"><div className="font-semibold text-sm">{song?.title || 'No encontrada'}</div>{song && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key}</div>}</button>
                  <button onClick={() => removeSongFromSetlist(selectedSetlist, item.songId)} className="p-2 rounded-xl text-red-500"><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Listas</h1><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Organiza tus canciones</p></div><button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={16} /> Nueva</button></div>
      {state.setlists.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={48} className="mx-auto mb-3 opacity-40" /><h3 className="font-bold text-base mb-1">No tienes listas</h3></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.setlists.map(list => (
            <div key={list.id} onClick={() => setSelectedSetlist(list.id)} className="rounded-2xl border p-5 cursor-pointer transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <div className="flex items-start justify-between gap-2 mb-2"><h3 className="font-bold text-base truncate">{list.name}</h3><button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar "${list.name}"?`)) removeSetlist(list.id); }} className="p-1.5 rounded-lg text-red-500"><Trash2 size={16} /></button></div>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>{list.songs.length} canciones</p>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}><span>Ver lista</span><ArrowRight size={14} /></div>
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Nueva Lista</h3>
            <input type="text" placeholder="Nombre" value={newSetlistName} onChange={e => setNewSetlistName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createSetlist()} autoFocus className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <div className="flex gap-2"><button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button><button onClick={createSetlist} disabled={!newSetlistName.trim()} className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersPage({ onSelectSong, showNotification }: any) {
  const { state, addOrder, removeOrder, updateOrder } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrderName, setNewOrderName] = useState('');
  const [newOrderType, setNewOrderType] = useState('Culto');
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const allAvailableSongs = useMemo(() => [...allSongs, ...state.customSongs], [state.customSongs]);

  const createOrder = () => {
    if (!newOrderName.trim()) return;
    const newOrder: Order = {
      id: crypto.randomUUID(),
      name: newOrderName.trim(),
      type: newOrderType,
      date: new Date().toISOString().split('T')[0],
      items: [],
    };
    addOrder(newOrder);
    setSelectedOrder(newOrder);
    setShowCreateModal(false);
    setNewOrderName('');
    showNotification('Orden creada', 'success');
  };

  const addItemToOrder = (song: Song) => {
    if (!selectedOrder) return;
    const updatedOrder = {
      ...selectedOrder,
      items: [...selectedOrder.items, { id: crypto.randomUUID(), title: song.title, songId: song.id, key: song.key }],
    };
    updateOrder(updatedOrder);
    setSelectedOrder(updatedOrder);
    setShowAddSongModal(false);
    setSongSearchQuery('');
    showNotification('Canción agregada', 'success');
  };

  const removeItemFromOrder = (itemId: string) => {
    if (!selectedOrder) return;
    const updatedOrder = { ...selectedOrder, items: selectedOrder.items.filter(item => item.id !== itemId) };
    updateOrder(updatedOrder);
    setSelectedOrder(updatedOrder);
    showNotification('Elemento eliminado', 'success');
  };

  const filteredSongs = useMemo(() => {
    if (!songSearchQuery.trim()) return allAvailableSongs.slice(0, 10);
    const q = songSearchQuery.toLowerCase();
    return allAvailableSongs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [allAvailableSongs, songSearchQuery]);

  if (selectedOrder) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
          <div className="flex-1 min-w-0"><h2 className="text-xl font-bold truncate">{selectedOrder.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedOrder.type} • {selectedOrder.date} • {selectedOrder.items.length} elementos</p></div>
          <button onClick={() => setShowAddSongModal(true)} className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--accent)' }}><Plus size={20} /></button>
        </div>
        {selectedOrder.items.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={48} className="mx-auto mb-3 opacity-40" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay elementos</p></div>
        ) : (
          <div className="space-y-2">
            {selectedOrder.items.map((item, index) => {
              const matchedSong = item.songId ? allAvailableSongs.find(s => s.id === item.songId) : null;
              return (
                <div key={item.id} className="rounded-2xl border p-3 flex items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                  <span className="text-xs font-bold w-5" style={{ color: 'var(--accent)' }}>{index + 1}.</span>
                  <button onClick={() => matchedSong && onSelectSong(matchedSong)} className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-sm truncate">{item.title}</div>
                    <div className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>{item.key && <span>Tono: {item.key}</span>}{matchedSong && <span className="font-medium" style={{ color: 'var(--accent)' }}>• Ver</span>}</div>
                  </button>
                  <button onClick={() => removeItemFromOrder(item.id)} className="p-2 rounded-xl text-red-500"><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        )}
        {showAddSongModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAddSongModal(false)}>
            <div className="w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[80vh] flex flex-col" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg">Agregar canción</h3>
              <input type="text" placeholder="Buscar..." value={songSearchQuery} onChange={e => setSongSearchQuery(e.target.value)} className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} autoFocus />
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredSongs.map(song => (
                  <button key={song.id} onClick={() => addItemToOrder(song)} className="w-full text-left p-3 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                    <div><div className="font-medium text-sm">{song.title}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key}</div></div>
                    <Plus size={16} style={{ color: 'var(--accent)' }} />
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddSongModal(false)} className="w-full py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Órdenes de Culto</h1><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Programa de reuniones</p></div><button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={16} /> Nueva</button></div>
      {state.orders.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={48} className="mx-auto mb-3 opacity-40" /><h3 className="font-bold text-base mb-1">No hay órdenes</h3></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.orders.map(order => (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="rounded-2xl border p-5 cursor-pointer transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <div className="flex items-start justify-between gap-2 mb-2"><div><h3 className="font-bold text-base truncate">{order.name}</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.type} • {order.date}</p></div><button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar "${order.name}"?`)) removeOrder(order.id); }} className="p-1.5 rounded-lg text-red-500"><Trash2 size={16} /></button></div>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>{order.items.length} elementos</p>
              <div className="space-y-1">{order.items.slice(0, 3).map((item, i) => (<div key={i} className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>• {item.title}</div>))}</div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}><span>Ver orden</span><ArrowRight size={14} /></div>
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Nueva Orden</h3>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Título</label><input type="text" placeholder="Ej: Culto Dominical" value={newOrderName} onChange={e => setNewOrderName(e.target.value)} className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} autoFocus /></div>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Tipo</label><select value={newOrderType} onChange={e => setNewOrderType(e.target.value)} className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><option value="Culto">Culto</option><option value="Reunión de Jóvenes">Reunión de Jóvenes</option><option value="Ensayo">Ensayo</option><option value="Especial">Especial</option></select></div>
            <div className="flex gap-2"><button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button><button onClick={createOrder} disabled={!newOrderName.trim()} className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 text-white" style={{ backgroundColor: 'var(--accent)' }}>Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolsPage() {
  const [activeTab, setActiveTab] = useState<'metronome' | 'tuner' | 'circle'>('metronome');

  return (
    <div className="space-y-4 pb-20">
      <div><h1 className="text-2xl font-bold">Herramientas</h1><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Metrónomo, afinador y teoría musical</p></div>
      <div className="flex gap-2 p-1 rounded-2xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <button onClick={() => setActiveTab('metronome')} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: activeTab === 'metronome' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'metronome' ? 'var(--accent)' : 'var(--text-muted)', boxShadow: activeTab === 'metronome' ? 'var(--card-shadow)' : 'none' }}>Metrónomo</button>
        <button onClick={() => setActiveTab('tuner')} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: activeTab === 'tuner' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'tuner' ? 'var(--accent)' : 'var(--text-muted)', boxShadow: activeTab === 'tuner' ? 'var(--card-shadow)' : 'none' }}>Afinador</button>
        <button onClick={() => setActiveTab('circle')} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: activeTab === 'circle' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'circle' ? 'var(--accent)' : 'var(--text-muted)', boxShadow: activeTab === 'circle' ? 'var(--card-shadow)' : 'none' }}>Círculo</button>
      </div>
      <div className="rounded-3xl border p-4 sm:p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
        {activeTab === 'metronome' && <Metronome />}
        {activeTab === 'tuner' && <Tuner />}
        {activeTab === 'circle' && <CircleOfFifths />}
      </div>
    </div>
  );
}

function CircleOfFifths() {
  const majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

  return (
    <div className="space-y-4">
      <div className="text-center"><h3 className="text-lg font-bold mb-1">Círculo de Quintas</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Explora las tonalidades y sus relaciones</p></div>
      <div className="relative w-full max-w-sm mx-auto aspect-square">
        <div className="absolute inset-0 flex items-center justify-center"><div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><span className="text-lg font-bold">C</span></div></div>
        {majorKeys.map((key, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const radius = 42;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          return (<button key={key} className="absolute w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '2px solid var(--border-color)' }}>{key}</button>);
        })}
      </div>
      <div className="grid grid-cols-4 gap-2">{majorKeys.slice(0, 8).map(key => (<button key={key} className="py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>{key}</button>))}</div>
    </div>
  );
}
