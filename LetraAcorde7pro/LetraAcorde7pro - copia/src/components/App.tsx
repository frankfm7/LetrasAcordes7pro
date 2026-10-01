import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Song, Hymnal, Order, OrderItem } from './types';
import { songs as allSongs, hymnals } from './data/songs';
import { transposeLyrics } from './utils/chords';
import { generateSongShareText } from './utils/shareUtils';
import { Moon, Sun, Menu, X, Home, Search, Star, ListMusic, Music, Settings, Download, Upload, Plus, Heart, ChevronLeft, ChevronRight, Copy, Share2, Edit3, Trash2, RotateCcw, Play, Pause, MoreVertical, Filter, CheckSquare, Square, ArrowRight, Image, ClipboardPaste, GripVertical, Camera, MoveHorizontal } from 'lucide-react';
import AddHymnalModal from './components/AddHymnalModal';
import AddSongModal from './components/AddSongModal';
import EditHymnalModal from './components/EditHymnalModal';
import SongEditor from './components/SongEditor';
import SplashScreen from './components/SplashScreen';
import OCRModal from './components/OCRModal';
import Metronome from './components/Metronome';
import Tuner from './components/Tuner';
import CircleOfFifths from './components/CircleOfFifths';
import ExportImportModal from './components/ExportImportModal';
import ImageImportModal from './components/ImageImportModal';

function AppContent() {
  const { state, setTheme } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedHymnal, setSelectedHymnal] = useState<Hymnal | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddHymnalModal, setShowAddHymnalModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImageImportModal, setShowImageImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);

  const showNotification = useCallback((message: string, type: string = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2000);
  }, []);

  useEffect(() => {
    document.documentElement.className = state.preferences.theme;
    const savedBg = localStorage.getItem('cancionero-bg-image');
    if (savedBg) setBgImage(savedBg);

    // Limpiar cancioneros obsoletos y canciones huérfanas del localStorage
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];
    const validHymnalIds = ['mis-canciones']; // Solo este cancionero es válido
    const stateData = localStorage.getItem('cancionero-ruah-state');
    let needsReload = false;

    if (stateData) {
      try {
        const parsed = JSON.parse(stateData);

        // Limpiar cancioneros obsoletos
        if (parsed.customHymnals) {
          const cleanedHymnals = parsed.customHymnals.filter((h: any) =>
            !obsoleteHymnalIds.includes(h.id) && validHymnalIds.includes(h.id)
          );
          if (cleanedHymnals.length !== parsed.customHymnals.length) {
            parsed.customHymnals = cleanedHymnals;
            needsReload = true;
          }
        }

        // Limpiar canciones huérfanas (que no pertenecen a cancioneros válidos)
        if (parsed.customSongs) {
          const cleanedSongs = parsed.customSongs.filter((s: any) =>
            validHymnalIds.includes(s.hymnalId)
          );
          if (cleanedSongs.length !== parsed.customSongs.length) {
            console.log(`Eliminando ${parsed.customSongs.length - cleanedSongs.length} canciones huérfanas`);
            parsed.customSongs = cleanedSongs;
            needsReload = true;
          }
        }

        if (needsReload) {
          localStorage.setItem('cancionero-ruah-state', JSON.stringify(parsed));
          window.location.reload();
        }
      } catch (e) {
        console.error('Error cleaning localStorage:', e);
      }
    }

    // Listener para abrir modal de imagen desde el modal de importación
    const handleOpenImageImport = () => {
      setShowImageImportModal(true);
    };
    window.addEventListener('openImageImport', handleOpenImageImport);

    return () => {
      window.removeEventListener('openImageImport', handleOpenImageImport);
    };
  }, [state.preferences.theme]);

  const handleSelectSong = useCallback((song: Song) => setSelectedSong(song), []);
  const handleSelectHymnal = useCallback((hymnal: Hymnal) => setSelectedHymnal(hymnal), []);
  const handleBack = useCallback(() => {
    if (selectedSong) setSelectedSong(null);
    else if (selectedHymnal) setSelectedHymnal(null);
    else setCurrentPage('home');
  }, [selectedSong, selectedHymnal]);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page); setSelectedSong(null); setSelectedHymnal(null); setSidebarOpen(false); setEditingSong(null);
  }, []);

  const handleExport = useCallback(() => {
    try {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `cancionero7pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      showNotification('Respaldo exportado', 'success');
    } catch { showNotification('Error al exportar', 'error'); }
  }, [state, showNotification]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.favorites && data.setlists) {
            localStorage.setItem('cancionero-ruah-state', JSON.stringify(data));
            showNotification('Respaldo restaurado', 'success'); window.location.reload();
          } else showNotification('Archivo inválido', 'error');
        } catch { showNotification('Error al importar', 'error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showNotification]);

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBgImage(result); localStorage.setItem('cancionero-bg-image', result);
    };
    reader.readAsDataURL(file);
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  if (editingSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport} bgImage={bgImage} onBgImageChange={handleBgImageChange} fileInputRef={fileInputRef} setShowExportModal={setShowExportModal} setShowImportModal={setShowImportModal} setShowImageImportModal={setShowImageImportModal}>
        <SongEditor song={editingSong} onBack={() => setEditingSong(null)} />
      </Layout>
    );
  }

  if (selectedSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport} bgImage={bgImage} onBgImageChange={handleBgImageChange} fileInputRef={fileInputRef} setShowExportModal={setShowExportModal} setShowImportModal={setShowImportModal} setShowImageImportModal={setShowImageImportModal}>
        <SongView song={selectedSong} onBack={handleBack} showNotification={showNotification} onEdit={() => setEditingSong(selectedSong)} />
      </Layout>
    );
  }

  if (selectedHymnal) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport} bgImage={bgImage} onBgImageChange={handleBgImageChange} fileInputRef={fileInputRef} setShowExportModal={setShowExportModal} setShowImportModal={setShowImportModal} setShowImageImportModal={setShowImageImportModal}>
        <HymnalView hymnal={selectedHymnal} onSelectSong={handleSelectSong} onBack={handleBack} showNotification={showNotification} />
      </Layout>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} />;
      case 'search': return <SearchPage onSelectSong={handleSelectSong} />;
      case 'favorites': return <FavoritesPage onSelectSong={handleSelectSong} />;
      case 'setlists': return <SetlistsPage onSelectSong={handleSelectSong} showNotification={showNotification} />;
      case 'orders': return <OrdersPage onSelectSong={handleSelectSong} showNotification={showNotification} />;
      case 'tools': return <ToolsPage />;
      default: return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport} onAddHymnal={() => setShowAddHymnalModal(true)} bgImage={bgImage} onBgImageChange={handleBgImageChange} fileInputRef={fileInputRef} setShowExportModal={setShowExportModal} setShowImportModal={setShowImportModal} setShowImageImportModal={setShowImageImportModal}>
      {renderPage()}
      {showAddHymnalModal && <AddHymnalModal onClose={() => setShowAddHymnalModal(false)} />}
      {showExportModal && <ExportImportModal onClose={() => setShowExportModal(false)} mode="export" showNotification={showNotification} />}
      {showImportModal && <ExportImportModal onClose={() => setShowImportModal(false)} mode="import" showNotification={showNotification} />}
      {showImageImportModal && <ImageImportModal onClose={() => setShowImageImportModal(false)} showNotification={showNotification} />}
      {notification && (
        <div className="fixed top-20 right-4 z-[100] p-4 rounded-xl shadow-lg animate-fade-in max-w-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{notification.message}</span>
        </div>
      )}
    </Layout>
  );
}

function Layout({ children, currentPage, onNavigate, sidebarOpen, setSidebarOpen, onImport, onExport, onAddHymnal, bgImage, onBgImageChange, fileInputRef, setShowExportModal, setShowImportModal, setShowImageImportModal }: any) {
  const { state, setTheme } = useApp();
  const [globalBg, setGlobalBg] = useState<string | null>(null);
  const menuItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'favorites', label: 'Favoritos', icon: Star },
    { id: 'setlists', label: 'Listas', icon: ListMusic },
    { id: 'orders', label: 'Órdenes', icon: Music },
    { id: 'tools', label: 'Herramientas', icon: Settings },
  ];

  // Cargar fondo global
  useEffect(() => {
    const saved = localStorage.getItem('global-bg-image');
    if (saved) setGlobalBg(saved);
  }, []);

  // Usar bgImage (del himnario) o globalBg como fondo
  const activeBg = bgImage || globalBg;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', backgroundImage: activeBg ? `url(${activeBg})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {activeBg && <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: state.preferences.theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)', zIndex: 0 }} />}
      <div className="relative" style={{ zIndex: 1 }}>
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
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 mt-4 px-3" style={{ color: 'var(--text-muted)' }}>Gestión</p>
              {onAddHymnal && <button onClick={() => { onAddHymnal(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1" style={{ color: 'var(--text-secondary)' }}><Plus size={20} /><span className="font-medium text-sm">Nuevo Himnario</span></button>}
              <button onClick={() => { setShowImportModal(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1" style={{ color: 'var(--text-secondary)' }}><Upload size={20} /><span className="font-medium text-sm">Importar Canciones</span></button>
              <button onClick={() => { setShowExportModal(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1" style={{ color: 'var(--text-secondary)' }}><Download size={20} /><span className="font-medium text-sm">Exportar Canciones</span></button>
              <button onClick={() => { fileInputRef.current?.click(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1" style={{ color: 'var(--text-secondary)' }}><Image size={20} /><span className="font-medium text-sm">{bgImage ? 'Cambiar Fondo' : 'Imagen de Fondo'}</span></button>
              {bgImage && <button onClick={() => { localStorage.removeItem('cancionero-bg-image'); window.location.reload(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-red-500"><X size={20} /><span className="font-medium text-sm">Quitar Fondo</span></button>}
            </nav>
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button onClick={() => setTheme(state.preferences.theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {state.preferences.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}Modo {state.preferences.theme === 'dark' ? 'Claro' : 'Oscuro'}
              </button>
            </div>
          </aside>
        )}
        <input ref={fileInputRef as any} type="file" accept="image/*" onChange={onBgImageChange} style={{ display: 'none' }} />
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
            {[{ id: 'home', label: 'Inicio', icon: Home }, { id: 'search', label: 'Buscar', icon: Search }, { id: 'favorites', label: 'Favoritos', icon: Heart }, { id: 'setlists', label: 'Listas', icon: ListMusic }, { id: 'tools', label: 'Tools', icon: Settings }].map(item => {
              const isActive = currentPage === item.id;
              return (<button key={item.id} onClick={() => onNavigate(item.id)} className={`flex-1 flex flex-col items-center py-3 px-1 transition-all ${isActive ? 'scale-105' : 'opacity-60'}`} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}><item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} /><span className="text-[10px] font-semibold mt-1">{item.label}</span>{isActive && <div className="absolute top-0 w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />}</button>);
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

// Continuará en el siguiente mensaje debido al tamaño...
// Los demás componentes (HomePage, SongView, HymnalView, SearchPage, FavoritesPage, SetlistsPage, OrdersPage, ToolsPage)
// se mantienen igual pero con las mejoras integradas

function HomePage({ onSelectSong, onSelectHymnal, onSearch, onAddHymnal }: any) {
  const { state, toggleFavorite, isFavorite } = useApp();
  const allAvailableSongs = useMemo(() => {
    // IDs de cancioneros obsoletos que deben filtrarse
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];

    // Filtrar canciones predefinidas (solo las que pertenecen a cancioneros válidos)
    const validPredefinedSongs = allSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));

    // Filtrar canciones personalizadas (excluir las de cancioneros obsoletos)
    const validCustomSongs = state.customSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));

    // Combinar canciones válidas
    const customSongsMap = new Map(validCustomSongs.map(s => [s.id, s]));
    const combinedSongs = validPredefinedSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(validPredefinedSongs.map(s => s.id));
    const newCustomSongs = validCustomSongs.filter(s => !defaultSongIds.has(s.id));

    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);
  const allHymnals = useMemo(() => {
    const defaultHymnals = hymnals.map(h => state.customHymnals.find(ch => ch.id === h.id) || h);
    const customOnly = state.customHymnals.filter(ch => !hymnals.find(h => h.id === ch.id));
    return [...defaultHymnals, ...customOnly];
  }, [state.customHymnals]);
  const featuredSongs = allAvailableSongs.slice(0, 6);

  return (
    <div className="space-y-6 pb-4">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><span>📚</span> Cancioneros</h2>
          <button onClick={onAddHymnal} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={14} /> Nuevo</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {allHymnals.map((hymnal) => {
            const hymnalSongs = allAvailableSongs.filter(s => s.hymnalId === hymnal.id);
            return (
              <button key={hymnal.id} onClick={() => onSelectHymnal(hymnal)} className="rounded-xl sm:rounded-2xl relative overflow-hidden p-2 sm:p-4 flex flex-col justify-between text-left transition-all hover:scale-[1.03] active:scale-[0.97]" style={{ aspectRatio: '3/4', background: hymnal.image ? `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${hymnal.image}) center/cover` : `linear-gradient(135deg, ${hymnal.color}, ${hymnal.color}cc)`, boxShadow: `0 4px 12px ${hymnal.color}44` }}>
                <div><div className="text-3xl sm:text-5xl mb-1 sm:mb-3">{hymnal.icon}</div><div className="text-white font-bold text-xs sm:text-lg leading-tight mb-1 sm:mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{hymnal.name}</div></div>
                <div><div className="text-white/90 text-xs sm:text-sm font-semibold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{hymnalSongs.length} canciones</div><div className="text-white/70 text-[10px] sm:text-xs" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{hymnal.language}</div></div>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">🎵 Destacadas</h2>
          <button onClick={onSearch} className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Ver todas →</button>
        </div>
        <div className="space-y-2">
          {featuredSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-3 p-3 rounded-2xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <button onClick={() => onSelectSong(song)} className="flex-1 text-left flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>{song.code.charAt(0)}</div>
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{song.title}</div><div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature}</div></div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
              <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-xl" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={18} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Los demás componentes se mantienen igual que en la versión anterior
// SongView, HymnalView, SearchPage, FavoritesPage, SetlistsPage, OrdersPage, ToolsPage

function SongView({ song: initialSong, onBack, showNotification, onEdit }: any) {
  const { state, toggleFavorite, isFavorite, setFontSize, setShowChords, setCapo, addSongToSetlist, updateCustomSong, removeCustomSong } = useApp();
  const [transposition, setTransposition] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [currentLanguage, setCurrentLanguage] = useState<string>(initialSong.language.split('/')[0]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showEditKeysModal, setShowEditKeysModal] = useState(false);
  const [editingKeySlot, setEditingKeySlot] = useState<1 | 2 | null>(null);
  const [isMinor, setIsMinor] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Estados para el sistema de 4 botones de transposición
  const [customKeys, setCustomKeys] = useState<{ key1: string | null; key2: string | null; key3: string | null }>({ key1: null, key2: null, key3: null });
  const [showKeySelector, setShowKeySelector] = useState(false);
  const [editingButton, setEditingButton] = useState<1 | 2 | 3 | null>(null);
  const [selectedNote, setSelectedNote] = useState('C');
  const [selectedIsMinor, setSelectedIsMinor] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);

  // Estado para el Círculo de Quintas
  const [showCircleOfFifths, setShowCircleOfFifths] = useState(false);

  const song = useMemo(() => {
    const customSong = state.customSongs.find(s => s.id === initialSong.id);
    return customSong || initialSong;
  }, [initialSong, state.customSongs]);
  const { preferences } = state;

  // Sincronizar el tono activo cuando el tono original de la canción cambia
  useEffect(() => {
    // Si el tono activo es el original (null), mantenerlo sincronizado
    if (activeKey === null) {
      // No hacer nada, el botón 1 ya muestra song.key automáticamente
    } else {
      // Si hay un tono personalizado activo, verificar si necesita actualizarse
      const isCustomKey = customKeys.key1 === activeKey || customKeys.key2 === activeKey || customKeys.key3 === activeKey;

      // Si el tono activo ya no coincide con ningún tono personalizado, volver al original
      if (!isCustomKey && activeKey !== song.key) {
        setActiveKey(null);
        setTransposition(0);
      }
    }
  }, [song.key, activeKey, customKeys]);

  // Resetear transposición cuando el tono original cambia y estábamos en el tono original
  useEffect(() => {
    if (activeKey === null && transposition !== 0) {
      setTransposition(0);
    }
  }, [song.key, activeKey, transposition]);

  // Cargar claves personalizadas desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`song-keys-${song.id}`);
    if (saved) {
      try {
        setCustomKeys(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading custom keys:', e);
      }
    }
  }, [song.id]);

  // Guardar claves personalizadas en localStorage
  const saveCustomKeys = (keys: { key1: string | null; key2: string | null; key3: string | null }) => {
    setCustomKeys(keys);
    localStorage.setItem(`song-keys-${song.id}`, JSON.stringify(keys));
  };

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

        // Guardar estado del auto-scroll
        const wasAutoScrolling = isAutoScrolling;

        // Pausar auto-scroll si está activo
        if (isAutoScrolling) {
          setIsAutoScrolling(false);
        }

        // Navegar a la sección
        container.scrollTo({ top: relativeTop - 80, behavior: 'smooth' });

        // Reanudar auto-scroll después de 2 segundos si estaba activo
        if (wasAutoScrolling) {
          setTimeout(() => {
            setIsAutoScrolling(true);
          }, 2000);
        }
      }
    }
  };

  const handleSelectActiveKey = (key: string | null) => {
    setActiveKey(key);
    if (key === null) { setTransposition(0); }
    else {
      const baseKey = key.replace(/m$/, '');
      const baseOriginalKey = song.key.replace(/m$/, '');
      const originalIndex = allNotes.indexOf(baseOriginalKey);
      const newIndex = allNotes.indexOf(baseKey);
      if (originalIndex !== -1 && newIndex !== -1) setTransposition(newIndex - originalIndex);
    }
  };

  const handleSelectOptionalKey = (slot: 1 | 2, note: string) => {
    const updatedSong = { ...song };
    const fullNote = isMinor ? note + 'm' : note;
    if (slot === 1) updatedSong.optionalKey1 = fullNote;
    else updatedSong.optionalKey2 = fullNote;
    updateCustomSong(updatedSong);
    setShowEditKeysModal(false); setEditingKeySlot(null); setIsMinor(false);
  };

  // Función para manejar la selección de tono desde el Círculo de Quintas
  const handleCircleKeySelect = (key: string) => {
    // Extraer la nota base (sin 'm' si es menor)
    const baseKey = key.replace(/m$/, '');
    const baseOriginalKey = song.key.replace(/m$/, '');

    const originalIndex = allNotes.indexOf(baseOriginalKey);
    const newIndex = allNotes.indexOf(baseKey);

    if (originalIndex !== -1 && newIndex !== -1) {
      const semitones = newIndex - originalIndex;
      setTransposition(semitones);
      setActiveKey(key);
      setShowCircleOfFifths(false);
      showNotification(`Transpuesto a ${key}`, 'success');
    }
  };

  // Funciones para el sistema de 4 botones de transposición
  const handleKeyButtonClick = (buttonIndex: 0 | 1 | 2 | 3, key: string | null) => {
    if (buttonIndex === 0) {
      // Botón 1: Tono original
      setActiveKey(null);
      setTransposition(0);
    } else {
      // Botones 2, 3, 4: Aplicar tono personalizado
      setActiveKey(key);
      if (key) {
        const baseKey = key.replace(/m$/, '');
        const baseOriginalKey = song.key.replace(/m$/, '');
        const originalIndex = allNotes.indexOf(baseOriginalKey);
        const newIndex = allNotes.indexOf(baseKey);
        if (originalIndex !== -1 && newIndex !== -1) {
          setTransposition(newIndex - originalIndex);
        }
      }
    }
  };

  const handleKeyButtonLongPress = (buttonIndex: 1 | 2 | 3) => {
    setEditingButton(buttonIndex);
    setSelectedNote('C');
    setSelectedIsMinor(false);
    setShowKeySelector(true);
  };

  const handleKeyButtonDoubleClick = (buttonIndex: 1 | 2 | 3) => {
    handleKeyButtonLongPress(buttonIndex);
  };

  const handleSaveCustomKey = () => {
    if (editingButton === null) return;

    const fullNote = selectedIsMinor ? selectedNote + 'm' : selectedNote;
    const newKeys = { ...customKeys };

    if (editingButton === 1) newKeys.key1 = fullNote;
    else if (editingButton === 2) newKeys.key2 = fullNote;
    else if (editingButton === 3) newKeys.key3 = fullNote;

    saveCustomKeys(newKeys);
    setShowKeySelector(false);
    setEditingButton(null);
    showNotification(`Botón ${editingButton} actualizado a ${fullNote}`, 'success');
  };

  const handleMouseDown = (buttonIndex: 1 | 2 | 3) => {
    longPressTimerRef.current = window.setTimeout(() => {
      handleKeyButtonLongPress(buttonIndex);
      longPressTimerRef.current = null;
    }, 1000); // 1 segundo para clic largo
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDoubleClick = (buttonIndex: 1 | 2 | 3) => {
    handleKeyButtonDoubleClick(buttonIndex);
  };

  const copyLyrics = () => {
    const cleanLyrics = transposedLyrics.replace(/\/\/[^\n]*\n/g, '').replace(/\n{3,}/g, '\n\n').trim();
    navigator.clipboard.writeText(cleanLyrics); showNotification('Letra copiada', 'success');
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
        <div className="relative" data-menu>
          <button onClick={() => setShowActionsMenu(!showActionsMenu)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><MoreVertical size={18} /></button>
          {showActionsMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowActionsMenu(false)}
                style={{ backgroundColor: 'transparent' }}
              />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <button onClick={() => { onEdit(); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80" style={{ color: 'var(--text-primary)' }}><Edit3 size={16} /> Editar</button>
                <button onClick={() => { setShowAddToList(true); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><ListMusic size={16} /> Agregar a lista</button>
                <button onClick={() => { copyLyrics(); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Copy size={16} /> Copiar letra</button>
                <button onClick={() => { shareSong(); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Share2 size={16} /> Compartir</button>
                <button onClick={() => { setShowEditKeysModal(true); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Settings size={16} /> Notas opcionales</button>
                <button onClick={() => { if (confirm(`¿Estás seguro de eliminar "${song.title}"?`)) { removeCustomSong(song.id); onBack(); } setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t text-red-500"><Trash2 size={16} /> Eliminar</button>
              </div>
            </>
          )}
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="p-2 rounded-xl" style={{ backgroundColor: showConfig ? 'var(--accent-light)' : 'var(--bg-tertiary)', color: showConfig ? 'var(--accent)' : 'var(--text-primary)' }}><Settings size={18} /></button>
      </div>

      {/* Sistema de 4 botones de transposición */}
      <div className="flex-shrink-0 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Botón 1: Tono Original */}
          <button
            onClick={() => handleKeyButtonClick(0, null)}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${activeKey === null ? 'ring-2 ring-offset-1 ring-purple-500 scale-105' : ''}`}
            style={{
              backgroundColor: activeKey === null ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeKey === null ? 'white' : 'var(--text-secondary)',
              minWidth: '36px'
            }}
            title="Tono original"
          >
            {song.key}
          </button>

          {/* Botón 2: Tono Personalizado 1 */}
          <button
            onClick={() => handleKeyButtonClick(1, customKeys.key1)}
            onMouseDown={() => handleMouseDown(1)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={() => handleDoubleClick(1)}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${activeKey === customKeys.key1 ? 'ring-2 ring-offset-1 ring-purple-500 scale-105' : ''}`}
            style={{
              backgroundColor: activeKey === customKeys.key1 ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeKey === customKeys.key1 ? 'white' : 'var(--text-secondary)',
              minWidth: '36px'
            }}
            title={customKeys.key1 ? `${customKeys.key1} (clic largo para editar)` : 'Sin tono (clic largo para editar)'}
          >
            {customKeys.key1 || '+'}
          </button>

          {/* Botón 3: Tono Personalizado 2 */}
          <button
            onClick={() => handleKeyButtonClick(2, customKeys.key2)}
            onMouseDown={() => handleMouseDown(2)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={() => handleDoubleClick(2)}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${activeKey === customKeys.key2 ? 'ring-2 ring-offset-1 ring-purple-500 scale-105' : ''}`}
            style={{
              backgroundColor: activeKey === customKeys.key2 ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeKey === customKeys.key2 ? 'white' : 'var(--text-secondary)',
              minWidth: '36px'
            }}
            title={customKeys.key2 ? `${customKeys.key2} (clic largo para editar)` : 'Sin tono (clic largo para editar)'}
          >
            {customKeys.key2 || '+'}
          </button>

          {/* Botón 4: Tono Personalizado 3 */}
          <button
            onClick={() => handleKeyButtonClick(3, customKeys.key3)}
            onMouseDown={() => handleMouseDown(3)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={() => handleDoubleClick(3)}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${activeKey === customKeys.key3 ? 'ring-2 ring-offset-1 ring-purple-500 scale-105' : ''}`}
            style={{
              backgroundColor: activeKey === customKeys.key3 ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeKey === customKeys.key3 ? 'white' : 'var(--text-secondary)',
              minWidth: '36px'
            }}
            title={customKeys.key3 ? `${customKeys.key3} (clic largo para editar)` : 'Sin tono (clic largo para editar)'}
          >
            {customKeys.key3 || '+'}
          </button>

          {/* Botón Círculo de Quintas */}
          <button
            onClick={() => setShowCircleOfFifths(true)}
            className="px-2 py-1 rounded-md text-xs font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--gold)',
              color: 'white',
              minWidth: '36px'
            }}
            title="Abrir Círculo de Quintas"
          >
            🎯
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="flex-shrink-0 rounded-2xl border p-4 space-y-4 mb-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div>
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">Transposición</span>{transposition !== 0 && <button onClick={() => { setTransposition(0); setActiveKey(null); }} className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}><RotateCcw size={12} /> Original</button>}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTransposition(t => t - 1)} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>−</button>
              <div className="flex-1 text-center"><span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{transposition > 0 ? `+${transposition}` : transposition}</span><span className="text-xs block" style={{ color: 'var(--text-muted)' }}>semitonos</span></div>
              <button onClick={() => setTransposition(t => t + 1)} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>+</button>
            </div>
          </div>
          <div><span className="text-sm font-semibold mb-2 block">Tamaño de Letra</span><div className="flex items-center gap-3"><span className="text-xs">A</span><input type="range" min="14" max="32" value={preferences.fontSize} onChange={e => setFontSize(Number(e.target.value))} className="flex-1 accent-purple-600" /><span className="text-xl font-bold">A</span><span className="text-xs w-10 text-right">{preferences.fontSize}px</span></div></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Mostrar Acordes</span><button onClick={() => setShowChords(!preferences.showChords)} className="w-12 h-7 rounded-full transition-all relative" style={{ backgroundColor: preferences.showChords ? 'var(--accent)' : 'var(--bg-tertiary)' }}><div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all" style={{ left: preferences.showChords ? '26px' : '4px' }} /></button></div>
          <div><span className="text-sm font-semibold mb-2 block">Capo de Guitarra</span><div className="flex items-center gap-3"><span className="text-xs">0</span><input type="range" min="0" max="12" value={preferences.capo} onChange={e => setCapo(Number(e.target.value))} className="flex-1 accent-purple-600" /><span className="text-xs w-10 text-right">{preferences.capo}</span></div></div>
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
            {state.setlists.length === 0 ? <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No tienes listas</p> : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {state.setlists.map(setlist => (
                  <button key={setlist.id} onClick={() => { addSongToSetlist(setlist.id, { songId: song.id, transposition: 0, notes: '', order: setlist.songs.length }); setShowAddToList(false); showNotification('Agregado', 'success'); }} className="w-full text-left p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="font-medium text-sm">{setlist.name}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{setlist.songs.length} canciones</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showEditKeysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => { setShowEditKeysModal(false); setEditingKeySlot(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Notas Opcionales</h3>
            {!editingKeySlot ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2"><span className="font-semibold text-sm">Nota Opcional 1</span><span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--gold-light)', color: 'var(--gold)' }}>{song.optionalKey1 || 'No configurada'}</span></div>
                  <button onClick={() => setEditingKeySlot(1)} className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{song.optionalKey1 ? 'Cambiar' : 'Configurar'}</button>
                </div>
                <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2"><span className="font-semibold text-sm">Nota Opcional 2</span><span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--gold-light)', color: 'var(--gold)' }}>{song.optionalKey2 || 'No configurada'}</span></div>
                  <button onClick={() => setEditingKeySlot(2)} className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{song.optionalKey2 ? 'Cambiar' : 'Configurar'}</button>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-sm mb-3">Selecciona la nota para Opcional {editingKeySlot}</h4>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setIsMinor(false)} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all" style={{ backgroundColor: !isMinor ? 'var(--accent)' : 'var(--bg-tertiary)', color: !isMinor ? 'white' : 'var(--text-primary)' }}>Mayor</button>
                  <button onClick={() => setIsMinor(true)} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all" style={{ backgroundColor: isMinor ? 'var(--accent)' : 'var(--bg-tertiary)', color: isMinor ? 'white' : 'var(--text-primary)' }}>Menor</button>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {allNotes.map(note => (<button key={note} onClick={() => handleSelectOptionalKey(editingKeySlot, note)} className="py-4 rounded-xl text-lg font-bold hover:scale-105 transition-transform" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', border: '2px solid var(--accent)' }}>{note}{isMinor ? 'm' : ''}</button>))}
                </div>
                <button onClick={() => { setEditingKeySlot(null); setIsMinor(false); }} className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Volver</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de selección de notas para los botones personalizados */}
      {showKeySelector && editingButton && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowKeySelector(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Editar Botón {editingButton}</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Selecciona la nota</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {allNotes.map(note => (
                    <button
                      key={note}
                      onClick={() => setSelectedNote(note)}
                      className={`py-3 rounded-lg text-base font-bold transition-all ${selectedNote === note ? 'scale-110' : ''}`}
                      style={{
                        backgroundColor: selectedNote === note ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: selectedNote === note ? 'white' : 'var(--text-primary)',
                        border: selectedNote === note ? '2px solid var(--accent)' : '2px solid transparent'
                      }}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Tipo de acorde</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedIsMinor(false)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${!selectedIsMinor ? 'scale-105' : ''}`}
                    style={{
                      backgroundColor: !selectedIsMinor ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: !selectedIsMinor ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    Mayor (M)
                  </button>
                  <button
                    onClick={() => setSelectedIsMinor(true)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${selectedIsMinor ? 'scale-105' : ''}`}
                    style={{
                      backgroundColor: selectedIsMinor ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: selectedIsMinor ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    Menor (m)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Vista previa:</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {selectedNote}{selectedIsMinor ? 'm' : ''}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeySelector(false)}
                  className="flex-1 py-3 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCustomKey}
                  className="flex-1 py-3 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal del Círculo de Quintas */}
      {showCircleOfFifths && (
        <CircleOfFifths
          currentKey={activeKey || song.key}
          onKeySelect={handleCircleKeySelect}
          onClose={() => setShowCircleOfFifths(false)}
        />
      )}
    </div>
  );
}

// Los demás componentes se mantienen igual que en la versión anterior
// HymnalView, SearchPage, FavoritesPage, SetlistsPage, OrdersPage, ToolsPage

function HymnalView({ hymnal: initialHymnal, onSelectSong, onBack, showNotification }: any) {
  const { state, toggleFavorite, isFavorite, removeCustomHymnal, updateCustomHymnal, addMultipleCustomSongs, removeMultipleCustomSongs, addMultipleToFavorites, removeCustomSong } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [showBgSelector, setShowBgSelector] = useState(false);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  const hymnal = useMemo(() => {
    const customHymnal = state.customHymnals.find(h => h.id === initialHymnal.id);
    return customHymnal || initialHymnal;
  }, [initialHymnal, state.customHymnals]);

  // Cargar imagen de fondo del himnario
  useEffect(() => {
    if (hymnal.image) {
      setBgImage(hymnal.image);
    }
  }, [hymnal.image]);

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBgImage(result);
      // Guardar en localStorage para este himnario
      localStorage.setItem(`hymnal-bg-${hymnal.id}`, result);
    };
    reader.readAsDataURL(file);
  };

  const removeBgImage = () => {
    setBgImage(null);
    localStorage.removeItem(`hymnal-bg-${hymnal.id}`);
  };

  const hymnalSongs = useMemo(() => {
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs].filter(s => s.hymnalId === hymnal.id);
  }, [hymnal.id, state.customSongs]);

  const hasCopiedSongs = useMemo(() => {
    const stored = localStorage.getItem('cancionero-copied-songs');
    if (!stored) return false;
    try { const parsed = JSON.parse(stored); return Array.isArray(parsed) && parsed.length > 0; } catch { return false; }
  }, []);

  const toggleSongSelection = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) newSelected.delete(songId); else newSelected.add(songId);
    setSelectedSongs(newSelected);
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar "${hymnal.name}"?`)) { removeCustomHymnal(hymnal.id); onBack(); }
  };

  const handleDeleteSelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    if (confirm(`¿Eliminar ${selectedSongs.size} canción(es)?`)) {
      removeMultipleCustomSongs(Array.from(selectedSongs));
      setSelectedSongs(new Set()); setSelectionMode(false);
    }
  };

  const copySelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    const selectedSongsList = hymnalSongs.filter(s => selectedSongs.has(s.id));
    localStorage.setItem('cancionero-copied-songs', JSON.stringify(selectedSongsList));
    showNotification(`${selectedSongs.size} copiada(s)`, 'success');
  };

  const pasteSongs = () => {
    const stored = localStorage.getItem('cancionero-copied-songs');
    if (!stored) { showNotification('No hay canciones copiadas', 'error'); return; }
    let songsToPaste: Song[];
    try { songsToPaste = JSON.parse(stored); } catch { showNotification('Error', 'error'); return; }
    if (songsToPaste.length === 0) { showNotification('No hay canciones', 'error'); return; }
    const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
    const startNumber = hymnalSongs.length + 1;
    const timestamp = Date.now();
    const newSongs: Song[] = songsToPaste.map((song, index) => ({ ...song, id: `custom-${timestamp}-${index}`, hymnalId: hymnal.id, code: `${prefix}${startNumber + index}`, number: startNumber + index }));
    addMultipleCustomSongs(newSongs);
    localStorage.removeItem('cancionero-copied-songs');
    showNotification(`${newSongs.length} pegada(s)`, 'success');
  };

  const addSelectedToFavorites = () => {
    if (selectedSongs.size === 0) return;
    addMultipleToFavorites(Array.from(selectedSongs));
    showNotification(`${selectedSongs.size} agregada(s)`, 'success');
    setSelectedSongs(new Set()); setSelectionMode(false);
  };

  const exportHymnal = () => {
    const data = { hymnal, songs: hymnalSongs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${hymnal.name.replace(/\s+/g, '_')}.json`;
    a.click(); URL.revokeObjectURL(url);
    showNotification('Himnario exportado', 'success');
  };

  const shareHymnal = async () => {
    const text = `${hymnal.name}\n${hymnalSongs.length} canciones\n\nCanciones:\n${hymnalSongs.map(s => `- ${s.title}`).join('\n')}`;
    if (navigator.share) {
      try { await navigator.share({ title: hymnal.name, text }); } catch (err) { console.log('Error:', err); }
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Copiado', 'success');
    }
  };

  const handleLongPressStart = (songId: string) => {
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressTriggered(true);
      if (!selectionMode) setSelectionMode(true);
      toggleSongSelection(songId);
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => setLongPressTriggered(false), 100);
    }, 500);
  };

  const handleLongPressEnd = () => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } };

  const handleSongClick = (song: Song) => {
    if (selectionMode) toggleSongSelection(song.id);
    else onSelectSong(song);
  };

  return (
    <div className="relative space-y-4 pb-4">
      {/* Fondo del himnario */}
      {bgImage && (
        <>
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              zIndex: -2,
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundColor: state.preferences.theme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
              zIndex: -1,
            }}
          />
        </>
      )}

      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: hymnal.color + '20' }}>{hymnal.icon}</div>
        <div className="flex-1"><h2 className="text-lg font-bold">{hymnal.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hymnalSongs.length} canciones • {hymnal.language}</p></div>
        <button onClick={() => { setSelectionMode(!selectionMode); setSelectedSongs(new Set()); }} className="p-2 rounded-lg" style={{ backgroundColor: selectionMode ? 'var(--accent)' : 'var(--bg-tertiary)', color: selectionMode ? 'white' : 'var(--text-primary)' }}><CheckSquare size={20} /></button>
        {hasCopiedSongs && !selectionMode && <button onClick={pasteSongs} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--gold)', color: 'white' }} title="Pegar"><ClipboardPaste size={20} /></button>}
        {!selectionMode && <button onClick={() => setShowAddSongModal(true)} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={20} /></button>}
        <div className="relative" data-menu>
          <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><MoreVertical size={20} /></button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
                style={{ backgroundColor: 'transparent' }}
              />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <button onClick={() => { setShowMenu(false); setShowEditModal(true); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80" style={{ color: 'var(--text-primary)' }}><Edit3 size={16} /> Editar</button>
                <button onClick={() => { setShowMenu(false); setShowBgSelector(true); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Image size={16} /> Fondo</button>
                <button onClick={() => { setShowMenu(false); exportHymnal(); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Download size={16} /> Exportar</button>
                <button onClick={() => { setShowMenu(false); shareHymnal(); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Share2 size={16} /> Compartir</button>
                {hymnal.isCustom && <button onClick={() => { setShowMenu(false); handleDelete(); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 text-red-500"><Trash2 size={16} /> Eliminar</button>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de fondo */}
      {showBgSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowBgSelector(false)}>
          <div className="w-full max-w-md rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Imagen de Fondo</h3>
            <div className="space-y-4">
              {bgImage && (
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img src={bgImage} alt="Fondo actual" className="w-full h-full object-cover" />
                  <button onClick={removeBgImage} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleBgImageChange} className="hidden" />
                <div className="rounded-xl border-2 border-dashed p-6 text-center transition-all hover:border-opacity-70" style={{ borderColor: 'var(--border-color)' }}>
                  <Image size={40} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm font-medium">{bgImage ? 'Cambiar imagen' : 'Subir imagen de fondo'}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Se mostrará al entrar al himnario</p>
                </div>
              </label>
              <button onClick={() => setShowBgSelector(false)} className="w-full py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectionMode && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
          <button onClick={() => { if (selectedSongs.size === hymnalSongs.length) setSelectedSongs(new Set()); else setSelectedSongs(new Set(hymnalSongs.map(s => s.id))); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{selectedSongs.size > 0 && selectedSongs.size === hymnalSongs.length ? 'Deseleccionar' : 'Seleccionar todo'}</button>
          {selectedSongs.size > 0 && (<><span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{selectedSongs.size} seleccionada(s)</span><div className="flex-1" /><div className="relative" data-selection-menu><button onClick={() => setShowSelectionMenu(!showSelectionMenu)} className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><MoreVertical size={16} /> Opciones</button>
            {showSelectionMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSelectionMenu(false)}
                  style={{ backgroundColor: 'transparent' }}
                />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                  <button onClick={() => { addSelectedToFavorites(); setShowSelectionMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80" style={{ color: 'var(--text-primary)' }}><Star size={16} style={{ color: 'var(--gold)' }} /> Favoritos</button>
                  <button onClick={() => { copySelectedSongs(); setShowSelectionMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Copy size={16} /> Copiar</button>
                  <button onClick={() => { handleDeleteSelectedSongs(); setShowSelectionMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: '#ef4444', borderColor: 'var(--border-color)' }}><Trash2 size={16} /> Eliminar</button>
                </div>
              </>
            )}
          </div></>)}
        </div>
      )}

      <div className="space-y-2">
        {hymnalSongs.map(song => (
          <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--border-color)', borderWidth: selectedSongs.has(song.id) ? '2px' : '1px' }}>
            {selectionMode && <button onClick={() => toggleSongSelection(song.id)} className="p-1" style={{ color: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--text-muted)' }}>{selectedSongs.has(song.id) ? <CheckSquare size={20} /> : <Square size={20} />}</button>}
            <button onClick={() => handleSongClick(song)} onMouseDown={() => handleLongPressStart(song.id)} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd} onTouchStart={() => handleLongPressStart(song.id)} onTouchEnd={handleLongPressEnd} onTouchCancel={handleLongPressEnd} onContextMenu={(e) => { if (longPressTriggered) e.preventDefault(); }} className="flex-1 text-left" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
              <div className="flex items-center gap-2"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{song.code}</span><span className="font-medium text-sm">{song.title}</span></div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM</div>
            </button>
            {!selectionMode && (
              <>
                <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-lg" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={18} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
                <button onClick={() => { if (confirm(`¿Eliminar "${song.title}"?`)) { removeMultipleCustomSongs([song.id]); showNotification('Canción eliminada', 'success'); } }} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={18} /></button>
              </>
            )}
          </div>
        ))}
        {hymnalSongs.length === 0 && <div className="text-center py-12"><Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay canciones</p></div>}
      </div>

      {showEditModal && <EditHymnalModal hymnal={hymnal} onClose={() => setShowEditModal(false)} onSave={(updatedHymnal) => { updateCustomHymnal(updatedHymnal); setShowEditModal(false); }} />}
      {showAddSongModal && <AddSongModal hymnal={hymnal} onClose={() => setShowAddSongModal(false)} />}
    </div>
  );
}

function SearchPage({ onSelectSong }: any) {
  const { state, toggleFavorite, isFavorite } = useApp();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterHymnal, setFilterHymnal] = useState('');
  const allAvailableSongs = useMemo(() => {
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];
    const validPredefinedSongs = allSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const validCustomSongs = state.customSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const customSongsMap = new Map(validCustomSongs.map(s => [s.id, s]));
    const combinedSongs = validPredefinedSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(validPredefinedSongs.map(s => s.id));
    const newCustomSongs = validCustomSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);
  const filteredSongs = useMemo(() => {
    if (!query && !filterHymnal) return [];
    return allAvailableSongs.filter(song => {
      const q = query.toLowerCase();
      const matchesQuery = !query || song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q) || song.code.toLowerCase().includes(q) || song.lyrics.toLowerCase().includes(q);
      const matchesHymnal = !filterHymnal || song.hymnalId === filterHymnal;
      return matchesQuery && matchesHymnal;
    });
  }, [query, filterHymnal, allAvailableSongs]);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-bold mb-1">Buscar</h2><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Busca por título, artista, código o letra</p></div><button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: showFilters ? 'var(--accent)' : 'var(--bg-tertiary)', color: showFilters ? 'white' : 'var(--text-primary)' }}><Filter size={16} /> Filtros</button></div>
      <div className="relative"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} /><input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar canciones..." className="w-full pl-12 pr-12 py-4 rounded-2xl border text-base font-medium" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', boxShadow: 'var(--card-shadow)' }} autoFocus />{query && <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={16} /></button>}</div>
      {showFilters && (<div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div><label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Himnario</label><select value={filterHymnal} onChange={e => setFilterHymnal(e.target.value)} className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><option value="">Todos</option>{[...hymnals, ...state.customHymnals].map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}</select></div></div>)}
      <div><div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>{filteredSongs.length} resultado{filteredSongs.length !== 1 ? 's' : ''}</div><div className="space-y-2">{filteredSongs.map((song) => (<div key={song.id} className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}><button onClick={() => onSelectSong(song)} className="flex-1 text-left"><div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono px-2 py-0.5 rounded-lg font-bold" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>{song.code}</span><span className="font-bold text-base">{song.title}</span></div><div className="text-sm" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM</div></button><button onClick={() => toggleFavorite(song.id)} className="p-2.5 rounded-xl" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={20} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button></div>))}</div>{filteredSongs.length === 0 && query && <div className="text-center py-12"><Music size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-base" style={{ color: 'var(--text-muted)' }}>No se encontraron canciones</p></div>}</div>
    </div>
  );
}

function FavoritesPage({ onSelectSong }: any) {
  const { state, toggleFavorite } = useApp();
  const favoriteSongs = useMemo(() => {
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs].filter(s => state.favorites.includes(s.id));
  }, [state.favorites, state.customSongs]);

  return (
    <div className="space-y-4 pb-4"><div className="flex items-center gap-2"><span className="text-2xl">⭐</span><div><h2 className="text-lg font-bold">Mis Favoritos</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{favoriteSongs.length} canciones</p></div></div>
      {favoriteSongs.length > 0 ? (<div className="space-y-2">{favoriteSongs.map(song => (<div key={song.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><button onClick={() => onSelectSong(song)} className="flex-1 text-left"><div className="flex items-center gap-2"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{song.code}</span><span className="font-medium text-sm">{song.title}</span></div><div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.language}</div></button><button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-lg" style={{ color: 'var(--gold)' }}><Star size={18} fill="currentColor" /></button></div>))}</div>) : (<div className="text-center py-12"><Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aún no tienes favoritos</p></div>)}
    </div>
  );
}

function SetlistsPage({ onSelectSong, showNotification }: any) {
  const { state, addSetlist, removeSetlist, addSongToSetlist, removeSongFromSetlist } = useApp();
  const [selectedSetlist, setSelectedSetlist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');
  const allAvailableSongs = useMemo(() => {
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];
    const validPredefinedSongs = allSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const validCustomSongs = state.customSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const customSongsMap = new Map(validCustomSongs.map(s => [s.id, s]));
    const combinedSongs = validPredefinedSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(validPredefinedSongs.map(s => s.id));
    const newCustomSongs = validCustomSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);
  const currentSetlist = state.setlists.find(s => s.id === selectedSetlist);

  const createSetlist = () => { if (newSetlistName.trim()) { addSetlist(newSetlistName.trim()); setNewSetlistName(''); setShowCreateModal(false); } };

  const exportSetlist = () => {
    if (!currentSetlist) return;
    const data = { setlist: currentSetlist, songs: currentSetlist.songs.map(ss => allAvailableSongs.find(s => s.id === ss.songId)).filter(Boolean) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${currentSetlist.name.replace(/\s+/g, '_')}.json`;
    a.click(); URL.revokeObjectURL(url);
    showNotification('Lista exportada', 'success');
  };

  if (selectedSetlist && currentSetlist) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-3"><button onClick={() => setSelectedSetlist(null)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button><div className="flex-1"><h2 className="text-xl font-bold">{currentSetlist.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentSetlist.songs.length} canciones</p></div><button onClick={exportSetlist} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><Download size={20} /></button></div>
        {currentSetlist.songs.length === 0 ? (<div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay canciones</p></div>) : (
          <div className="space-y-2">{currentSetlist.songs.map((item, index) => {
            const song = allAvailableSongs.find(s => s.id === item.songId);
            return (<div key={item.songId} className="rounded-2xl border p-3 flex items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><span className="text-xs font-bold w-5" style={{ color: 'var(--accent)' }}>{index + 1}.</span><button onClick={() => song && onSelectSong(song)} className="flex-1 text-left"><div className="font-semibold text-sm">{song?.title || 'No encontrada'}</div>{song && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key}</div>}</button><button onClick={() => removeSongFromSetlist(selectedSetlist, item.songId)} className="p-2 rounded-xl text-red-500"><Trash2 size={16} /></button></div>);
          })}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Listas</h1><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Organiza tus canciones</p></div><button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={16} /> Nueva</button></div>
      {state.setlists.length === 0 ? (<div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={48} className="mx-auto mb-3 opacity-40" /><h3 className="font-bold text-base mb-1">No tienes listas</h3><button onClick={() => setShowCreateModal(true)} className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 mt-4" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={14} /> Crear</button></div>) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{state.setlists.map(list => (<div key={list.id} onClick={() => setSelectedSetlist(list.id)} className="rounded-2xl border p-5 cursor-pointer transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}><div className="flex items-start justify-between gap-2 mb-2"><h3 className="font-bold text-base truncate">{list.name}</h3><button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar "${list.name}"?`)) removeSetlist(list.id); }} className="p-1.5 rounded-lg text-red-500"><Trash2 size={16} /></button></div><p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>{list.songs.length} canciones</p><div className="space-y-1">{list.songs.slice(0, 3).map((item, i) => { const song = allAvailableSongs.find(s => s.id === item.songId); return <div key={i} className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>• {song?.title || 'Canción'}</div>; })}</div><div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}><span>Ver lista</span><ArrowRight size={14} /></div></div>))}</div>
      )}
      {showCreateModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreateModal(false)}><div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}><h3 className="font-bold text-lg">Nueva Lista</h3><input type="text" placeholder="Nombre" value={newSetlistName} onChange={e => setNewSetlistName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createSetlist()} autoFocus className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /><div className="flex gap-2"><button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button><button onClick={createSetlist} disabled={!newSetlistName.trim()} className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Crear</button></div></div></div>)}
    </div>
  );
}

function OrdersPage({ onSelectSong, showNotification }: any) {
  const { state, addOrder, removeOrder, updateOrder } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [newOrderName, setNewOrderName] = useState('');
  const [newOrderType, setNewOrderType] = useState('Culto');
  const orders = state.orders || [];
  const allAvailableSongs = useMemo(() => {
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];
    const validPredefinedSongs = allSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const validCustomSongs = (state.customSongs || []).filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    return [...validPredefinedSongs, ...validCustomSongs];
  }, [state.customSongs]);

  const createOrder = () => {
    const newOrder: Order = { id: crypto.randomUUID(), name: newOrderName.trim() || `Orden ${orders.length + 1}`, eventType: newOrderType, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: '' };
    addOrder(newOrder); setNewOrderName(''); setShowCreateModal(false);
  };

  const addTextItem = () => {
    if (!selectedOrder) return;
    const newItem: OrderItem = { id: crypto.randomUUID(), type: 'text', content: '', notes: '' };
    const updatedOrder = { ...selectedOrder, items: [...selectedOrder.items, newItem], updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const addSongItem = () => {
    if (!selectedOrder) return;
    const newItem: OrderItem = { id: crypto.randomUUID(), type: 'song', content: '', notes: '' };
    const updatedOrder = { ...selectedOrder, items: [...selectedOrder.items, newItem], updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const updateItem = (itemId: string, updates: Partial<OrderItem>) => {
    if (!selectedOrder) return;
    const updatedItems = selectedOrder.items.map(item => item.id === itemId ? { ...item, ...updates } : item);
    const updatedOrder = { ...selectedOrder, items: updatedItems, updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const removeItem = (itemId: string) => {
    if (!selectedOrder) return;
    const updatedOrder = { ...selectedOrder, items: selectedOrder.items.filter(item => item.id !== itemId), updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!selectedOrder) return;
    const newItems = [...selectedOrder.items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    const updatedOrder = { ...selectedOrder, items: newItems, updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const handleOCRResult = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    const newOrder: Order = {
      id: crypto.randomUUID(),
      name: `Orden extraída ${orders.length + 1}`,
      eventType: 'Culto',
      items: lines.map(line => ({ id: crypto.randomUUID(), type: 'text' as const, content: line.trim(), notes: '' })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '',
    };
    addOrder(newOrder);
    setSelectedOrder(newOrder);
    showNotification('Orden creada desde foto', 'success');
  };

  if (selectedOrder) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
          <div className="flex-1"><h2 className="text-xl font-bold">{selectedOrder.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedOrder.eventType} • {selectedOrder.items.length} elementos</p></div>
        </div>

        <div className="space-y-2">
          {selectedOrder.items.map((item, index) => (
            <div key={item.id} className="rounded-2xl border p-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{index + 1}.</span>
                <select value={item.type} onChange={(e) => updateItem(item.id, { type: e.target.value as 'text' | 'song' })} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <option value="text">Texto</option>
                  <option value="song">Canción</option>
                </select>
                <div className="flex-1" />
                <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1 rounded disabled:opacity-30" style={{ color: 'var(--text-primary)' }}><ChevronLeft size={16} style={{ transform: 'rotate(90deg)' }} /></button>
                <button onClick={() => moveItem(index, 'down')} disabled={index === selectedOrder.items.length - 1} className="p-1 rounded disabled:opacity-30" style={{ color: 'var(--text-primary)' }}><ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} /></button>
                <button onClick={() => removeItem(item.id)} className="p-1 rounded text-red-500"><Trash2 size={16} /></button>
              </div>
              {item.type === 'text' ? (
                <input type="text" value={item.content} onChange={(e) => updateItem(item.id, { content: e.target.value })} placeholder="Texto del orden..." className="w-full p-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              ) : (
                <select value={item.content} onChange={(e) => updateItem(item.id, { content: e.target.value })} className="w-full p-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="">Seleccionar canción...</option>
                  {allAvailableSongs.map(song => <option key={song.id} value={song.id}>{song.code} - {song.title}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={addTextItem} className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}><Plus size={16} /> Texto</button>
          <button onClick={addSongItem} className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Music size={16} /> Canción</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">Órdenes</h2><p className="text-sm" style={{ color: 'var(--text-muted)' }}>{orders.length} órdenes</p></div><div className="flex gap-2"><button onClick={() => setShowOCRModal(true)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }} title="Extraer desde foto"><Camera size={20} /></button><button onClick={() => setShowCreateModal(true)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={20} /></button></div></div>
      <div className="space-y-2">{orders.map(order => (<div key={order.id} className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><button onClick={() => setSelectedOrder(order)} className="flex-1 text-left"><div className="font-medium">{order.name}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.eventType} • {order.items.length} elementos</div></button><button onClick={() => { if (confirm(`¿Eliminar "${order.name}"?`)) removeOrder(order.id); }} className="p-2 rounded-lg" style={{ color: '#ef4444' }}><Trash2 size={16} /></button></div>))}{orders.length === 0 && <div className="text-center py-12"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay órdenes</p></div>}</div>
      {showCreateModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreateModal(false)}><div className="w-full max-w-md rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}><h3 className="font-bold text-lg mb-3">Nuevo Orden</h3><input type="text" value={newOrderName} onChange={e => setNewOrderName(e.target.value)} placeholder="Nombre" className="w-full p-3 rounded-xl border mb-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /><select value={newOrderType} onChange={e => setNewOrderType(e.target.value)} className="w-full p-3 rounded-xl border mb-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><option>Culto</option><option>Boda</option><option>Bautismo</option><option>Retiro</option><option>Conferencia</option><option>Otro</option></select><button onClick={createOrder} className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Crear</button></div></div>)}
      {showOCRModal && <OCRModal onClose={() => setShowOCRModal(false)} onExtract={handleOCRResult} mode="order" />}
    </div>
  );
}

function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [globalBg, setGlobalBg] = useState<string | null>(null);
  const [showBgManager, setShowBgManager] = useState(false);

  // Cargar fondo global
  useEffect(() => {
    const saved = localStorage.getItem('global-bg-image');
    if (saved) setGlobalBg(saved);
  }, []);

  const handleGlobalBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setGlobalBg(result);
      localStorage.setItem('global-bg-image', result);
    };
    reader.readAsDataURL(file);
  };

  const removeGlobalBg = () => {
    setGlobalBg(null);
    localStorage.removeItem('global-bg-image');
  };

  if (activeTool === 'metronome') return (<div className="pb-4"><button onClick={() => setActiveTool(null)} className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: 'var(--accent)' }}><ChevronLeft size={16} /> Volver</button><Metronome /></div>);
  if (activeTool === 'tuner') return (<div className="pb-4"><button onClick={() => setActiveTool(null)} className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: 'var(--accent)' }}><ChevronLeft size={16} /> Volver</button><Tuner /></div>);
  if (activeTool === 'circle') return (<div className="pb-4"><button onClick={() => setActiveTool(null)} className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: 'var(--accent)' }}><ChevronLeft size={16} /> Volver</button><CircleOfFifths /></div>);

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-2xl font-bold">Herramientas</h2>

      {/* Sección de Fondos Personalizados */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">🖼️ Fondos Personalizados</h3>
          <button onClick={() => setShowBgManager(!showBgManager)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
            {showBgManager ? 'Cerrar' : 'Gestionar'}
          </button>
        </div>

        {showBgManager && (
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h4 className="font-semibold text-sm mb-2">Fondo Global</h4>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Se aplicará a toda la aplicación (excepto himnarios con fondo propio)
              </p>
              {globalBg ? (
                <div className="relative rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
                  <img src={globalBg} alt="Fondo global" className="w-full h-full object-cover" />
                  <button onClick={removeGlobalBg} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed p-4 text-center mb-3" style={{ borderColor: 'var(--border-color)' }}>
                  <Image size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin fondo global</p>
                </div>
              )}
              <label className="cursor-pointer block">
                <input type="file" accept="image/*" onChange={handleGlobalBgChange} className="hidden" />
                <div className="py-3 rounded-xl text-center text-sm font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                  {globalBg ? 'Cambiar Fondo Global' : 'Subir Fondo Global'}
                </div>
              </label>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h4 className="font-semibold text-sm mb-2">💡 Cómo funciona</h4>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>• Cada himnario puede tener su propio fondo (se configura al editar el himnario)</li>
                <li>• El fondo global se usa como respaldo si el himnario no tiene fondo</li>
                <li>• Los fondos se guardan en tu navegador</li>
                <li>• Puedes cambiar o quitar fondos en cualquier momento</li>
              </ul>
            </div>
          </div>
        )}

        {!showBgManager && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {globalBg ? '✅ Fondo global configurado' : 'Configura fondos para diferentes áreas'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveTool('metronome')} className="rounded-2xl border p-5 text-center transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div className="text-4xl mb-2">🎵</div><h3 className="font-bold text-sm">Metrónomo</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>BPM, tap tempo, 3 sonidos</p></button>
        <button onClick={() => setActiveTool('tuner')} className="rounded-2xl border p-5 text-center transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div className="text-4xl mb-2">🎼</div><h3 className="font-bold text-sm">Afinador</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Guitarra, bajo, ukelele</p></button>
        <button onClick={() => setActiveTool('circle')} className="rounded-2xl border p-5 text-center transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div className="text-4xl mb-2">🎯</div><h3 className="font-bold text-sm">Círculo de Quintas</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Visualiza y transpone</p></button>
        <div className="rounded-2xl border p-5 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div className="text-4xl mb-2">🎸</div><h3 className="font-bold text-sm">Capo</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Calcula posición</p></div>
      </div>
    </div>
  );
}

export default function App() {
  return (<AppProvider><AppContent /></AppProvider>);
}


+++ src/App.tsx (修改后)
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Song, Hymnal, Order, OrderItem } from './types';
import { songs as allSongs, hymnals } from './data/songs';
import { transposeLyrics } from './utils/chords';
import { generateSongShareText } from './utils/shareUtils';
import { Moon, Sun, Menu, X, Home, Search, Star, ListMusic, Music, Settings, Download, Upload, Plus, Heart, ChevronLeft, ChevronRight, Copy, Share2, Edit3, Trash2, RotateCcw, Play, Pause, MoreVertical, Filter, CheckSquare, Square, ArrowRight, Image, ClipboardPaste, GripVertical, Camera, MoveHorizontal } from 'lucide-react';
import AddHymnalModal from './components/AddHymnalModal';
import AddSongModal from './components/AddSongModal';
import EditHymnalModal from './components/EditHymnalModal';
import SongEditor from './components/SongEditor';
import SplashScreen from './components/SplashScreen';
import OCRModal from './components/OCRModal';
import Metronome from './components/Metronome';
import Tuner from './components/Tuner';
import CircleOfFifths from './components/CircleOfFifths';
import ExportImportModal from './components/ExportImportModal';
import ImageImportModal from './components/ImageImportModal';

function AppContent() {
  const { state, setTheme } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedHymnal, setSelectedHymnal] = useState<Hymnal | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddHymnalModal, setShowAddHymnalModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImageImportModal, setShowImageImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);

  const showNotification = useCallback((message: string, type: string = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2000);
  }, []);

  useEffect(() => {
    document.documentElement.className = state.preferences.theme;
    const savedBg = localStorage.getItem('cancionero-bg-image');
    if (savedBg) setBgImage(savedBg);

    // Limpiar cancioneros obsoletos y canciones huérfanas del localStorage
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];
    const validHymnalIds = ['mis-canciones']; // Solo este cancionero es válido
    const stateData = localStorage.getItem('cancionero-ruah-state');
    let needsReload = false;

    if (stateData) {
      try {
        const parsed = JSON.parse(stateData);

        // Limpiar cancioneros obsoletos
        if (parsed.customHymnals) {
          const cleanedHymnals = parsed.customHymnals.filter((h: any) =>
            !obsoleteHymnalIds.includes(h.id) && validHymnalIds.includes(h.id)
          );
          if (cleanedHymnals.length !== parsed.customHymnals.length) {
            parsed.customHymnals = cleanedHymnals;
            needsReload = true;
          }
        }

        // Limpiar canciones huérfanas (que no pertenecen a cancioneros válidos)
        if (parsed.customSongs) {
          const cleanedSongs = parsed.customSongs.filter((s: any) =>
            validHymnalIds.includes(s.hymnalId)
          );
          if (cleanedSongs.length !== parsed.customSongs.length) {
            console.log(`Eliminando ${parsed.customSongs.length - cleanedSongs.length} canciones huérfanas`);
            parsed.customSongs = cleanedSongs;
            needsReload = true;
          }
        }

        if (needsReload) {
          localStorage.setItem('cancionero-ruah-state', JSON.stringify(parsed));
          window.location.reload();
        }
      } catch (e) {
        console.error('Error cleaning localStorage:', e);
      }
    }

    // Listener para abrir modal de imagen desde el modal de importación
    const handleOpenImageImport = () => {
      setShowImageImportModal(true);
    };
    window.addEventListener('openImageImport', handleOpenImageImport);

    return () => {
      window.removeEventListener('openImageImport', handleOpenImageImport);
    };
  }, [state.preferences.theme]);

  const handleSelectSong = useCallback((song: Song) => setSelectedSong(song), []);
  const handleSelectHymnal = useCallback((hymnal: Hymnal) => setSelectedHymnal(hymnal), []);
  const handleBack = useCallback(() => {
    if (selectedSong) setSelectedSong(null);
    else if (selectedHymnal) setSelectedHymnal(null);
    else setCurrentPage('home');
  }, [selectedSong, selectedHymnal]);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page); setSelectedSong(null); setSelectedHymnal(null); setSidebarOpen(false); setEditingSong(null);
  }, []);

  const handleExport = useCallback(() => {
    try {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `cancionero7pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      showNotification('Respaldo exportado', 'success');
    } catch { showNotification('Error al exportar', 'error'); }
  }, [state, showNotification]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.favorites && data.setlists) {
            localStorage.setItem('cancionero-ruah-state', JSON.stringify(data));
            showNotification('Respaldo restaurado', 'success'); window.location.reload();
          } else showNotification('Archivo inválido', 'error');
        } catch { showNotification('Error al importar', 'error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showNotification]);

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBgImage(result); localStorage.setItem('cancionero-bg-image', result);
    };
    reader.readAsDataURL(file);
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  if (editingSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport} bgImage={bgImage} onBgImageChange={handleBgImageChange} fileInputRef={fileInputRef} setShowExportModal={setShowExportModal} setShowImportModal={setShowImportModal} setShowImageImportModal={setShowImageImportModal}>
        <SongEditor song={editingSong} onBack={() => setEditingSong(null)} />
      </Layout>
    );
  }

  if (selectedSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport} bgImage={bgImage} onBgImageChange={handleBgImageChange} fileInputRef={fileInputRef} setShowExportModal={setShowExportModal} setShowImportModal={setShowImportModal} setShowImageImportModal={setShowImageImportModal}>
        <SongView song={selectedSong} onBack={handleBack} showNotification={showNotification} onEdit={() => setEditingSong(selectedSong)} />
      </Layout>
    );
  }

  if (selectedHymnal) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport} bgImage={bgImage} onBgImageChange={handleBgImageChange} fileInputRef={fileInputRef} setShowExportModal={setShowExportModal} setShowImportModal={setShowImportModal} setShowImageImportModal={setShowImageImportModal}>
        <HymnalView hymnal={selectedHymnal} onSelectSong={handleSelectSong} onBack={handleBack} showNotification={showNotification} />
      </Layout>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} />;
      case 'search': return <SearchPage onSelectSong={handleSelectSong} />;
      case 'favorites': return <FavoritesPage onSelectSong={handleSelectSong} />;
      case 'setlists': return <SetlistsPage onSelectSong={handleSelectSong} showNotification={showNotification} />;
      case 'orders': return <OrdersPage onSelectSong={handleSelectSong} showNotification={showNotification} />;
      case 'tools': return <ToolsPage />;
      default: return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onImport={handleImport} onExport={handleExport} onAddHymnal={() => setShowAddHymnalModal(true)} bgImage={bgImage} onBgImageChange={handleBgImageChange} fileInputRef={fileInputRef} setShowExportModal={setShowExportModal} setShowImportModal={setShowImportModal} setShowImageImportModal={setShowImageImportModal}>
      {renderPage()}
      {showAddHymnalModal && <AddHymnalModal onClose={() => setShowAddHymnalModal(false)} />}
      {showExportModal && <ExportImportModal onClose={() => setShowExportModal(false)} mode="export" showNotification={showNotification} />}
      {showImportModal && <ExportImportModal onClose={() => setShowImportModal(false)} mode="import" showNotification={showNotification} />}
      {showImageImportModal && <ImageImportModal onClose={() => setShowImageImportModal(false)} showNotification={showNotification} />}
      {notification && (
        <div className="fixed top-20 right-4 z-[100] p-4 rounded-xl shadow-lg animate-fade-in max-w-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{notification.message}</span>
        </div>
      )}
    </Layout>
  );
}

function Layout({ children, currentPage, onNavigate, sidebarOpen, setSidebarOpen, onImport, onExport, onAddHymnal, bgImage, onBgImageChange, fileInputRef, setShowExportModal, setShowImportModal, setShowImageImportModal }: any) {
  const { state, setTheme } = useApp();
  const [globalBg, setGlobalBg] = useState<string | null>(null);
  const menuItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'favorites', label: 'Favoritos', icon: Star },
    { id: 'setlists', label: 'Listas', icon: ListMusic },
    { id: 'orders', label: 'Órdenes', icon: Music },
    { id: 'tools', label: 'Herramientas', icon: Settings },
  ];

  // Cargar fondo global
  useEffect(() => {
    const saved = localStorage.getItem('global-bg-image');
    if (saved) setGlobalBg(saved);
  }, []);

  // Usar bgImage (del himnario) o globalBg como fondo
  const activeBg = bgImage || globalBg;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', backgroundImage: activeBg ? `url(${activeBg})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {activeBg && <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: state.preferences.theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)', zIndex: 0 }} />}
      <div className="relative" style={{ zIndex: 1 }}>
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
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 mt-4 px-3" style={{ color: 'var(--text-muted)' }}>Gestión</p>
              {onAddHymnal && <button onClick={() => { onAddHymnal(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1" style={{ color: 'var(--text-secondary)' }}><Plus size={20} /><span className="font-medium text-sm">Nuevo Himnario</span></button>}
              <button onClick={() => { setShowImportModal(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1" style={{ color: 'var(--text-secondary)' }}><Upload size={20} /><span className="font-medium text-sm">Importar Canciones</span></button>
              <button onClick={() => { setShowExportModal(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1" style={{ color: 'var(--text-secondary)' }}><Download size={20} /><span className="font-medium text-sm">Exportar Canciones</span></button>
              <button onClick={() => { fileInputRef.current?.click(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1" style={{ color: 'var(--text-secondary)' }}><Image size={20} /><span className="font-medium text-sm">{bgImage ? 'Cambiar Fondo' : 'Imagen de Fondo'}</span></button>
              {bgImage && <button onClick={() => { localStorage.removeItem('cancionero-bg-image'); window.location.reload(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-red-500"><X size={20} /><span className="font-medium text-sm">Quitar Fondo</span></button>}
            </nav>
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button onClick={() => setTheme(state.preferences.theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {state.preferences.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}Modo {state.preferences.theme === 'dark' ? 'Claro' : 'Oscuro'}
              </button>
            </div>
          </aside>
        )}
        <input ref={fileInputRef as any} type="file" accept="image/*" onChange={onBgImageChange} style={{ display: 'none' }} />
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
            {[{ id: 'home', label: 'Inicio', icon: Home }, { id: 'search', label: 'Buscar', icon: Search }, { id: 'favorites', label: 'Favoritos', icon: Heart }, { id: 'setlists', label: 'Listas', icon: ListMusic }, { id: 'tools', label: 'Tools', icon: Settings }].map(item => {
              const isActive = currentPage === item.id;
              return (<button key={item.id} onClick={() => onNavigate(item.id)} className={`flex-1 flex flex-col items-center py-3 px-1 transition-all ${isActive ? 'scale-105' : 'opacity-60'}`} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}><item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} /><span className="text-[10px] font-semibold mt-1">{item.label}</span>{isActive && <div className="absolute top-0 w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />}</button>);
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

// Continuará en el siguiente mensaje debido al tamaño...
// Los demás componentes (HomePage, SongView, HymnalView, SearchPage, FavoritesPage, SetlistsPage, OrdersPage, ToolsPage)
// se mantienen igual pero con las mejoras integradas

function HomePage({ onSelectSong, onSelectHymnal, onSearch, onAddHymnal }: any) {
  const { state, toggleFavorite, isFavorite } = useApp();
  const allAvailableSongs = useMemo(() => {
    // IDs de cancioneros obsoletos que deben filtrarse
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];

    // Filtrar canciones predefinidas (solo las que pertenecen a cancioneros válidos)
    const validPredefinedSongs = allSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));

    // Filtrar canciones personalizadas (excluir las de cancioneros obsoletos)
    const validCustomSongs = state.customSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));

    // Combinar canciones válidas
    const customSongsMap = new Map(validCustomSongs.map(s => [s.id, s]));
    const combinedSongs = validPredefinedSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(validPredefinedSongs.map(s => s.id));
    const newCustomSongs = validCustomSongs.filter(s => !defaultSongIds.has(s.id));

    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);
  const allHymnals = useMemo(() => {
    const defaultHymnals = hymnals.map(h => state.customHymnals.find(ch => ch.id === h.id) || h);
    const customOnly = state.customHymnals.filter(ch => !hymnals.find(h => h.id === ch.id));
    return [...defaultHymnals, ...customOnly];
  }, [state.customHymnals]);
  const featuredSongs = allAvailableSongs.slice(0, 6);

  return (
    <div className="space-y-6 pb-4">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><span>📚</span> Cancioneros</h2>
          <button onClick={onAddHymnal} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={14} /> Nuevo</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {allHymnals.map((hymnal) => {
            const hymnalSongs = allAvailableSongs.filter(s => s.hymnalId === hymnal.id);
            return (
              <button key={hymnal.id} onClick={() => onSelectHymnal(hymnal)} className="rounded-xl sm:rounded-2xl relative overflow-hidden p-2 sm:p-4 flex flex-col justify-between text-left transition-all hover:scale-[1.03] active:scale-[0.97]" style={{ aspectRatio: '3/4', background: hymnal.image ? `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${hymnal.image}) center/cover` : `linear-gradient(135deg, ${hymnal.color}, ${hymnal.color}cc)`, boxShadow: `0 4px 12px ${hymnal.color}44` }}>
                <div><div className="text-3xl sm:text-5xl mb-1 sm:mb-3">{hymnal.icon}</div><div className="text-white font-bold text-xs sm:text-lg leading-tight mb-1 sm:mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{hymnal.name}</div></div>
                <div><div className="text-white/90 text-xs sm:text-sm font-semibold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{hymnalSongs.length} canciones</div><div className="text-white/70 text-[10px] sm:text-xs" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{hymnal.language}</div></div>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">🎵 Destacadas</h2>
          <button onClick={onSearch} className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Ver todas →</button>
        </div>
        <div className="space-y-2">
          {featuredSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-3 p-3 rounded-2xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <button onClick={() => onSelectSong(song)} className="flex-1 text-left flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>{song.code.charAt(0)}</div>
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{song.title}</div><div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature}</div></div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
              <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-xl" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={18} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Los demás componentes se mantienen igual que en la versión anterior
// SongView, HymnalView, SearchPage, FavoritesPage, SetlistsPage, OrdersPage, ToolsPage

function SongView({ song: initialSong, onBack, showNotification, onEdit }: any) {
  const { state, toggleFavorite, isFavorite, setFontSize, setShowChords, setCapo, addSongToSetlist, updateCustomSong, removeCustomSong } = useApp();
  const [transposition, setTransposition] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [currentLanguage, setCurrentLanguage] = useState<string>(initialSong.language.split('/')[0]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showEditKeysModal, setShowEditKeysModal] = useState(false);
  const [editingKeySlot, setEditingKeySlot] = useState<1 | 2 | null>(null);
  const [isMinor, setIsMinor] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Estados para el sistema de 4 botones de transposición
  const [customKeys, setCustomKeys] = useState<{ key1: string | null; key2: string | null; key3: string | null }>({ key1: null, key2: null, key3: null });
  const [showKeySelector, setShowKeySelector] = useState(false);
  const [editingButton, setEditingButton] = useState<1 | 2 | 3 | null>(null);
  const [selectedNote, setSelectedNote] = useState('C');
  const [selectedIsMinor, setSelectedIsMinor] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);

  // Estado para el Círculo de Quintas
  const [showCircleOfFifths, setShowCircleOfFifths] = useState(false);

  const song = useMemo(() => {
    const customSong = state.customSongs.find(s => s.id === initialSong.id);
    return customSong || initialSong;
  }, [initialSong, state.customSongs]);
  const { preferences } = state;

  // Sincronizar el tono activo cuando el tono original de la canción cambia
  useEffect(() => {
    // Si el tono activo es el original (null), mantenerlo sincronizado
    if (activeKey === null) {
      // No hacer nada, el botón 1 ya muestra song.key automáticamente
    } else {
      // Si hay un tono personalizado activo, verificar si necesita actualizarse
      const isCustomKey = customKeys.key1 === activeKey || customKeys.key2 === activeKey || customKeys.key3 === activeKey;

      // Si el tono activo ya no coincide con ningún tono personalizado, volver al original
      if (!isCustomKey && activeKey !== song.key) {
        setActiveKey(null);
        setTransposition(0);
      }
    }
  }, [song.key, activeKey, customKeys]);

  // Resetear transposición cuando el tono original cambia y estábamos en el tono original
  useEffect(() => {
    if (activeKey === null && transposition !== 0) {
      setTransposition(0);
    }
  }, [song.key, activeKey, transposition]);

  // Cargar claves personalizadas desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`song-keys-${song.id}`);
    if (saved) {
      try {
        setCustomKeys(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading custom keys:', e);
      }
    }
  }, [song.id]);

  // Guardar claves personalizadas en localStorage
  const saveCustomKeys = (keys: { key1: string | null; key2: string | null; key3: string | null }) => {
    setCustomKeys(keys);
    localStorage.setItem(`song-keys-${song.id}`, JSON.stringify(keys));
  };

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

        // Guardar estado del auto-scroll
        const wasAutoScrolling = isAutoScrolling;

        // Pausar auto-scroll si está activo
        if (isAutoScrolling) {
          setIsAutoScrolling(false);
        }

        // Navegar a la sección
        container.scrollTo({ top: relativeTop - 80, behavior: 'smooth' });

        // Reanudar auto-scroll después de 2 segundos si estaba activo
        if (wasAutoScrolling) {
          setTimeout(() => {
            setIsAutoScrolling(true);
          }, 2000);
        }
      }
    }
  };

  const handleSelectActiveKey = (key: string | null) => {
    setActiveKey(key);
    if (key === null) { setTransposition(0); }
    else {
      const baseKey = key.replace(/m$/, '');
      const baseOriginalKey = song.key.replace(/m$/, '');
      const originalIndex = allNotes.indexOf(baseOriginalKey);
      const newIndex = allNotes.indexOf(baseKey);
      if (originalIndex !== -1 && newIndex !== -1) setTransposition(newIndex - originalIndex);
    }
  };

  const handleSelectOptionalKey = (slot: 1 | 2, note: string) => {
    const updatedSong = { ...song };
    const fullNote = isMinor ? note + 'm' : note;
    if (slot === 1) updatedSong.optionalKey1 = fullNote;
    else updatedSong.optionalKey2 = fullNote;
    updateCustomSong(updatedSong);
    setShowEditKeysModal(false); setEditingKeySlot(null); setIsMinor(false);
  };

  // Función para manejar la selección de tono desde el Círculo de Quintas
  const handleCircleKeySelect = (key: string) => {
    // Extraer la nota base (sin 'm' si es menor)
    const baseKey = key.replace(/m$/, '');
    const baseOriginalKey = song.key.replace(/m$/, '');

    const originalIndex = allNotes.indexOf(baseOriginalKey);
    const newIndex = allNotes.indexOf(baseKey);

    if (originalIndex !== -1 && newIndex !== -1) {
      const semitones = newIndex - originalIndex;
      setTransposition(semitones);
      setActiveKey(key);
      setShowCircleOfFifths(false);
      showNotification(`Transpuesto a ${key}`, 'success');
    }
  };

  // Funciones para el sistema de 4 botones de transposición
  const handleKeyButtonClick = (buttonIndex: 0 | 1 | 2 | 3, key: string | null) => {
    if (buttonIndex === 0) {
      // Botón 1: Tono original
      setActiveKey(null);
      setTransposition(0);
    } else {
      // Botones 2, 3, 4: Aplicar tono personalizado
      setActiveKey(key);
      if (key) {
        const baseKey = key.replace(/m$/, '');
        const baseOriginalKey = song.key.replace(/m$/, '');
        const originalIndex = allNotes.indexOf(baseOriginalKey);
        const newIndex = allNotes.indexOf(baseKey);
        if (originalIndex !== -1 && newIndex !== -1) {
          setTransposition(newIndex - originalIndex);
        }
      }
    }
  };

  const handleKeyButtonLongPress = (buttonIndex: 1 | 2 | 3) => {
    setEditingButton(buttonIndex);
    setSelectedNote('C');
    setSelectedIsMinor(false);
    setShowKeySelector(true);
  };

  const handleKeyButtonDoubleClick = (buttonIndex: 1 | 2 | 3) => {
    handleKeyButtonLongPress(buttonIndex);
  };

  const handleSaveCustomKey = () => {
    if (editingButton === null) return;

    const fullNote = selectedIsMinor ? selectedNote + 'm' : selectedNote;
    const newKeys = { ...customKeys };

    if (editingButton === 1) newKeys.key1 = fullNote;
    else if (editingButton === 2) newKeys.key2 = fullNote;
    else if (editingButton === 3) newKeys.key3 = fullNote;

    saveCustomKeys(newKeys);
    setShowKeySelector(false);
    setEditingButton(null);
    showNotification(`Botón ${editingButton} actualizado a ${fullNote}`, 'success');
  };

  const handleMouseDown = (buttonIndex: 1 | 2 | 3) => {
    longPressTimerRef.current = window.setTimeout(() => {
      handleKeyButtonLongPress(buttonIndex);
      longPressTimerRef.current = null;
    }, 1000); // 1 segundo para clic largo
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDoubleClick = (buttonIndex: 1 | 2 | 3) => {
    handleKeyButtonDoubleClick(buttonIndex);
  };

  const copyLyrics = () => {
    const cleanLyrics = transposedLyrics.replace(/\/\/[^\n]*\n/g, '').replace(/\n{3,}/g, '\n\n').trim();
    navigator.clipboard.writeText(cleanLyrics); showNotification('Letra copiada', 'success');
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
        <div className="relative" data-menu>
          <button onClick={() => setShowActionsMenu(!showActionsMenu)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><MoreVertical size={18} /></button>
          {showActionsMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowActionsMenu(false)}
                style={{ backgroundColor: 'transparent' }}
              />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <button onClick={() => { onEdit(); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80" style={{ color: 'var(--text-primary)' }}><Edit3 size={16} /> Editar</button>
                <button onClick={() => { setShowAddToList(true); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><ListMusic size={16} /> Agregar a lista</button>
                <button onClick={() => { copyLyrics(); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Copy size={16} /> Copiar letra</button>
                <button onClick={() => { shareSong(); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Share2 size={16} /> Compartir</button>
                <button onClick={() => { setShowEditKeysModal(true); setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Settings size={16} /> Notas opcionales</button>
                <button onClick={() => { if (confirm(`¿Estás seguro de eliminar "${song.title}"?`)) { removeCustomSong(song.id); onBack(); } setShowActionsMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t text-red-500"><Trash2 size={16} /> Eliminar</button>
              </div>
            </>
          )}
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="p-2 rounded-xl" style={{ backgroundColor: showConfig ? 'var(--accent-light)' : 'var(--bg-tertiary)', color: showConfig ? 'var(--accent)' : 'var(--text-primary)' }}><Settings size={18} /></button>
      </div>

      {/* Sistema de 4 botones de transposición */}
      <div className="flex-shrink-0 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Botón 1: Tono Original */}
          <button
            onClick={() => handleKeyButtonClick(0, null)}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${activeKey === null ? 'ring-2 ring-offset-1 ring-purple-500 scale-105' : ''}`}
            style={{
              backgroundColor: activeKey === null ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeKey === null ? 'white' : 'var(--text-secondary)',
              minWidth: '36px'
            }}
            title="Tono original"
          >
            {song.key}
          </button>

          {/* Botón 2: Tono Personalizado 1 */}
          <button
            onClick={() => handleKeyButtonClick(1, customKeys.key1)}
            onMouseDown={() => handleMouseDown(1)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={() => handleDoubleClick(1)}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${activeKey === customKeys.key1 ? 'ring-2 ring-offset-1 ring-purple-500 scale-105' : ''}`}
            style={{
              backgroundColor: activeKey === customKeys.key1 ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeKey === customKeys.key1 ? 'white' : 'var(--text-secondary)',
              minWidth: '36px'
            }}
            title={customKeys.key1 ? `${customKeys.key1} (clic largo para editar)` : 'Sin tono (clic largo para editar)'}
          >
            {customKeys.key1 || '+'}
          </button>

          {/* Botón 3: Tono Personalizado 2 */}
          <button
            onClick={() => handleKeyButtonClick(2, customKeys.key2)}
            onMouseDown={() => handleMouseDown(2)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={() => handleDoubleClick(2)}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${activeKey === customKeys.key2 ? 'ring-2 ring-offset-1 ring-purple-500 scale-105' : ''}`}
            style={{
              backgroundColor: activeKey === customKeys.key2 ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeKey === customKeys.key2 ? 'white' : 'var(--text-secondary)',
              minWidth: '36px'
            }}
            title={customKeys.key2 ? `${customKeys.key2} (clic largo para editar)` : 'Sin tono (clic largo para editar)'}
          >
            {customKeys.key2 || '+'}
          </button>

          {/* Botón 4: Tono Personalizado 3 */}
          <button
            onClick={() => handleKeyButtonClick(3, customKeys.key3)}
            onMouseDown={() => handleMouseDown(3)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={() => handleDoubleClick(3)}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${activeKey === customKeys.key3 ? 'ring-2 ring-offset-1 ring-purple-500 scale-105' : ''}`}
            style={{
              backgroundColor: activeKey === customKeys.key3 ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeKey === customKeys.key3 ? 'white' : 'var(--text-secondary)',
              minWidth: '36px'
            }}
            title={customKeys.key3 ? `${customKeys.key3} (clic largo para editar)` : 'Sin tono (clic largo para editar)'}
          >
            {customKeys.key3 || '+'}
          </button>

          {/* Botón Círculo de Quintas */}
          <button
            onClick={() => setShowCircleOfFifths(true)}
            className="px-2 py-1 rounded-md text-xs font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--gold)',
              color: 'white',
              minWidth: '36px'
            }}
            title="Abrir Círculo de Quintas"
          >
            🎯
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="flex-shrink-0 rounded-2xl border p-4 space-y-4 mb-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div>
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">Transposición</span>{transposition !== 0 && <button onClick={() => { setTransposition(0); setActiveKey(null); }} className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}><RotateCcw size={12} /> Original</button>}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTransposition(t => t - 1)} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>−</button>
              <div className="flex-1 text-center"><span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{transposition > 0 ? `+${transposition}` : transposition}</span><span className="text-xs block" style={{ color: 'var(--text-muted)' }}>semitonos</span></div>
              <button onClick={() => setTransposition(t => t + 1)} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>+</button>
            </div>
          </div>
          <div><span className="text-sm font-semibold mb-2 block">Tamaño de Letra</span><div className="flex items-center gap-3"><span className="text-xs">A</span><input type="range" min="14" max="32" value={preferences.fontSize} onChange={e => setFontSize(Number(e.target.value))} className="flex-1 accent-purple-600" /><span className="text-xl font-bold">A</span><span className="text-xs w-10 text-right">{preferences.fontSize}px</span></div></div>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Mostrar Acordes</span><button onClick={() => setShowChords(!preferences.showChords)} className="w-12 h-7 rounded-full transition-all relative" style={{ backgroundColor: preferences.showChords ? 'var(--accent)' : 'var(--bg-tertiary)' }}><div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all" style={{ left: preferences.showChords ? '26px' : '4px' }} /></button></div>
          <div><span className="text-sm font-semibold mb-2 block">Capo de Guitarra</span><div className="flex items-center gap-3"><span className="text-xs">0</span><input type="range" min="0" max="12" value={preferences.capo} onChange={e => setCapo(Number(e.target.value))} className="flex-1 accent-purple-600" /><span className="text-xs w-10 text-right">{preferences.capo}</span></div></div>
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
            {state.setlists.length === 0 ? <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No tienes listas</p> : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {state.setlists.map(setlist => (
                  <button key={setlist.id} onClick={() => { addSongToSetlist(setlist.id, { songId: song.id, transposition: 0, notes: '', order: setlist.songs.length }); setShowAddToList(false); showNotification('Agregado', 'success'); }} className="w-full text-left p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="font-medium text-sm">{setlist.name}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{setlist.songs.length} canciones</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showEditKeysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => { setShowEditKeysModal(false); setEditingKeySlot(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Notas Opcionales</h3>
            {!editingKeySlot ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2"><span className="font-semibold text-sm">Nota Opcional 1</span><span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--gold-light)', color: 'var(--gold)' }}>{song.optionalKey1 || 'No configurada'}</span></div>
                  <button onClick={() => setEditingKeySlot(1)} className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{song.optionalKey1 ? 'Cambiar' : 'Configurar'}</button>
                </div>
                <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2"><span className="font-semibold text-sm">Nota Opcional 2</span><span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--gold-light)', color: 'var(--gold)' }}>{song.optionalKey2 || 'No configurada'}</span></div>
                  <button onClick={() => setEditingKeySlot(2)} className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{song.optionalKey2 ? 'Cambiar' : 'Configurar'}</button>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-sm mb-3">Selecciona la nota para Opcional {editingKeySlot}</h4>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setIsMinor(false)} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all" style={{ backgroundColor: !isMinor ? 'var(--accent)' : 'var(--bg-tertiary)', color: !isMinor ? 'white' : 'var(--text-primary)' }}>Mayor</button>
                  <button onClick={() => setIsMinor(true)} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all" style={{ backgroundColor: isMinor ? 'var(--accent)' : 'var(--bg-tertiary)', color: isMinor ? 'white' : 'var(--text-primary)' }}>Menor</button>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {allNotes.map(note => (<button key={note} onClick={() => handleSelectOptionalKey(editingKeySlot, note)} className="py-4 rounded-xl text-lg font-bold hover:scale-105 transition-transform" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', border: '2px solid var(--accent)' }}>{note}{isMinor ? 'm' : ''}</button>))}
                </div>
                <button onClick={() => { setEditingKeySlot(null); setIsMinor(false); }} className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Volver</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de selección de notas para los botones personalizados */}
      {showKeySelector && editingButton && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowKeySelector(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Editar Botón {editingButton}</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Selecciona la nota</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {allNotes.map(note => (
                    <button
                      key={note}
                      onClick={() => setSelectedNote(note)}
                      className={`py-3 rounded-lg text-base font-bold transition-all ${selectedNote === note ? 'scale-110' : ''}`}
                      style={{
                        backgroundColor: selectedNote === note ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: selectedNote === note ? 'white' : 'var(--text-primary)',
                        border: selectedNote === note ? '2px solid var(--accent)' : '2px solid transparent'
                      }}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Tipo de acorde</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedIsMinor(false)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${!selectedIsMinor ? 'scale-105' : ''}`}
                    style={{
                      backgroundColor: !selectedIsMinor ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: !selectedIsMinor ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    Mayor (M)
                  </button>
                  <button
                    onClick={() => setSelectedIsMinor(true)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${selectedIsMinor ? 'scale-105' : ''}`}
                    style={{
                      backgroundColor: selectedIsMinor ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: selectedIsMinor ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    Menor (m)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Vista previa:</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {selectedNote}{selectedIsMinor ? 'm' : ''}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeySelector(false)}
                  className="flex-1 py-3 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCustomKey}
                  className="flex-1 py-3 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal del Círculo de Quintas */}
      {showCircleOfFifths && (
        <CircleOfFifths
          currentKey={activeKey || song.key}
          onKeySelect={handleCircleKeySelect}
          onClose={() => setShowCircleOfFifths(false)}
        />
      )}
    </div>
  );
}

// Los demás componentes se mantienen igual que en la versión anterior
// HymnalView, SearchPage, FavoritesPage, SetlistsPage, OrdersPage, ToolsPage

function HymnalView({ hymnal: initialHymnal, onSelectSong, onBack, showNotification }: any) {
  const { state, toggleFavorite, isFavorite, removeCustomHymnal, updateCustomHymnal, addMultipleCustomSongs, removeMultipleCustomSongs, addMultipleToFavorites, removeCustomSong } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [showBgSelector, setShowBgSelector] = useState(false);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  const hymnal = useMemo(() => {
    const customHymnal = state.customHymnals.find(h => h.id === initialHymnal.id);
    return customHymnal || initialHymnal;
  }, [initialHymnal, state.customHymnals]);

  // Cargar imagen de fondo del himnario
  useEffect(() => {
    if (hymnal.image) {
      setBgImage(hymnal.image);
    }
  }, [hymnal.image]);

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBgImage(result);
      // Guardar en localStorage para este himnario
      localStorage.setItem(`hymnal-bg-${hymnal.id}`, result);
    };
    reader.readAsDataURL(file);
  };

  const removeBgImage = () => {
    setBgImage(null);
    localStorage.removeItem(`hymnal-bg-${hymnal.id}`);
  };

  const hymnalSongs = useMemo(() => {
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs].filter(s => s.hymnalId === hymnal.id);
  }, [hymnal.id, state.customSongs]);

  const hasCopiedSongs = useMemo(() => {
    const stored = localStorage.getItem('cancionero-copied-songs');
    if (!stored) return false;
    try { const parsed = JSON.parse(stored); return Array.isArray(parsed) && parsed.length > 0; } catch { return false; }
  }, []);

  const toggleSongSelection = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) newSelected.delete(songId); else newSelected.add(songId);
    setSelectedSongs(newSelected);
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar "${hymnal.name}"?`)) { removeCustomHymnal(hymnal.id); onBack(); }
  };

  const handleDeleteSelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    if (confirm(`¿Eliminar ${selectedSongs.size} canción(es)?`)) {
      removeMultipleCustomSongs(Array.from(selectedSongs));
      setSelectedSongs(new Set()); setSelectionMode(false);
    }
  };

  const copySelectedSongs = () => {
    if (selectedSongs.size === 0) return;
    const selectedSongsList = hymnalSongs.filter(s => selectedSongs.has(s.id));
    localStorage.setItem('cancionero-copied-songs', JSON.stringify(selectedSongsList));
    showNotification(`${selectedSongs.size} copiada(s)`, 'success');
  };

  const pasteSongs = () => {
    const stored = localStorage.getItem('cancionero-copied-songs');
    if (!stored) { showNotification('No hay canciones copiadas', 'error'); return; }
    let songsToPaste: Song[];
    try { songsToPaste = JSON.parse(stored); } catch { showNotification('Error', 'error'); return; }
    if (songsToPaste.length === 0) { showNotification('No hay canciones', 'error'); return; }
    const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
    const startNumber = hymnalSongs.length + 1;
    const timestamp = Date.now();
    const newSongs: Song[] = songsToPaste.map((song, index) => ({ ...song, id: `custom-${timestamp}-${index}`, hymnalId: hymnal.id, code: `${prefix}${startNumber + index}`, number: startNumber + index }));
    addMultipleCustomSongs(newSongs);
    localStorage.removeItem('cancionero-copied-songs');
    showNotification(`${newSongs.length} pegada(s)`, 'success');
  };

  const addSelectedToFavorites = () => {
    if (selectedSongs.size === 0) return;
    addMultipleToFavorites(Array.from(selectedSongs));
    showNotification(`${selectedSongs.size} agregada(s)`, 'success');
    setSelectedSongs(new Set()); setSelectionMode(false);
  };

  const exportHymnal = () => {
    const data = { hymnal, songs: hymnalSongs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${hymnal.name.replace(/\s+/g, '_')}.json`;
    a.click(); URL.revokeObjectURL(url);
    showNotification('Himnario exportado', 'success');
  };

  const shareHymnal = async () => {
    const text = `${hymnal.name}\n${hymnalSongs.length} canciones\n\nCanciones:\n${hymnalSongs.map(s => `- ${s.title}`).join('\n')}`;
    if (navigator.share) {
      try { await navigator.share({ title: hymnal.name, text }); } catch (err) { console.log('Error:', err); }
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Copiado', 'success');
    }
  };

  const handleLongPressStart = (songId: string) => {
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressTriggered(true);
      if (!selectionMode) setSelectionMode(true);
      toggleSongSelection(songId);
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => setLongPressTriggered(false), 100);
    }, 500);
  };

  const handleLongPressEnd = () => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } };

  const handleSongClick = (song: Song) => {
    if (selectionMode) toggleSongSelection(song.id);
    else onSelectSong(song);
  };

  return (
    <div className="relative space-y-4 pb-4">
      {/* Fondo del himnario */}
      {bgImage && (
        <>
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              zIndex: -2,
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundColor: state.preferences.theme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
              zIndex: -1,
            }}
          />
        </>
      )}

      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: hymnal.color + '20' }}>{hymnal.icon}</div>
        <div className="flex-1"><h2 className="text-lg font-bold">{hymnal.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hymnalSongs.length} canciones • {hymnal.language}</p></div>
        {hasCopiedSongs && !selectionMode && <button onClick={pasteSongs} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--gold)', color: 'white' }} title="Pegar"><ClipboardPaste size={20} /></button>}
        {!selectionMode && <button onClick={() => setShowAddSongModal(true)} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={20} /></button>}
        <div className="relative" data-menu>
          <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><MoreVertical size={20} /></button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
                style={{ backgroundColor: 'transparent' }}
              />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <button onClick={() => { setShowMenu(false); setShowEditModal(true); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80" style={{ color: 'var(--text-primary)' }}><Edit3 size={16} /> Editar</button>
                <button onClick={() => { setShowMenu(false); setShowBgSelector(true); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Image size={16} /> Fondo</button>
                <button onClick={() => { setShowMenu(false); exportHymnal(); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Download size={16} /> Exportar</button>
                <button onClick={() => { setShowMenu(false); shareHymnal(); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Share2 size={16} /> Compartir</button>
                {hymnal.isCustom && <button onClick={() => { setShowMenu(false); handleDelete(); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 text-red-500"><Trash2 size={16} /> Eliminar</button>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de fondo */}
      {showBgSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowBgSelector(false)}>
          <div className="w-full max-w-md rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Imagen de Fondo</h3>
            <div className="space-y-4">
              {bgImage && (
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img src={bgImage} alt="Fondo actual" className="w-full h-full object-cover" />
                  <button onClick={removeBgImage} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleBgImageChange} className="hidden" />
                <div className="rounded-xl border-2 border-dashed p-6 text-center transition-all hover:border-opacity-70" style={{ borderColor: 'var(--border-color)' }}>
                  <Image size={40} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm font-medium">{bgImage ? 'Cambiar imagen' : 'Subir imagen de fondo'}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Se mostrará al entrar al himnario</p>
                </div>
              </label>
              <button onClick={() => setShowBgSelector(false)} className="w-full py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectionMode && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => { setSelectionMode(false); setSelectedSongs(new Set()); setShowSelectionMenu(false); }}
            style={{ backgroundColor: 'transparent' }}
          />
          <div className="relative z-40 flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
            <button onClick={() => { if (selectedSongs.size === hymnalSongs.length) setSelectedSongs(new Set()); else setSelectedSongs(new Set(hymnalSongs.map(s => s.id))); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{selectedSongs.size > 0 && selectedSongs.size === hymnalSongs.length ? 'Deseleccionar' : 'Seleccionar todo'}</button>
            {selectedSongs.size > 0 && (
              <>
                <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{selectedSongs.size} seleccionada(s)</span>
                <div className="flex-1" />
                <div className="relative" data-selection-menu>
                  <button onClick={() => setShowSelectionMenu(!showSelectionMenu)} className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                    <MoreVertical size={16} /> Opciones
                  </button>
                  {showSelectionMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSelectionMenu(false)}
                        style={{ backgroundColor: 'transparent' }}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                        <button onClick={() => { addSelectedToFavorites(); setShowSelectionMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80" style={{ color: 'var(--text-primary)' }}><Star size={16} style={{ color: 'var(--gold)' }} /> Favoritos</button>
                        <button onClick={() => { copySelectedSongs(); setShowSelectionMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}><Copy size={16} /> Copiar</button>
                        <button onClick={() => { handleDeleteSelectedSongs(); setShowSelectionMenu(false); }} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:opacity-80 border-t" style={{ color: '#ef4444', borderColor: 'var(--border-color)' }}><Trash2 size={16} /> Eliminar</button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        {hymnalSongs.map(song => (
          <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--border-color)', borderWidth: selectedSongs.has(song.id) ? '2px' : '1px' }}>
            {selectionMode && <button onClick={() => toggleSongSelection(song.id)} className="p-1" style={{ color: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--text-muted)' }}>{selectedSongs.has(song.id) ? <CheckSquare size={20} /> : <Square size={20} />}</button>}
            <button onClick={() => handleSongClick(song)} onMouseDown={() => handleLongPressStart(song.id)} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd} onTouchStart={() => handleLongPressStart(song.id)} onTouchEnd={handleLongPressEnd} onTouchCancel={handleLongPressEnd} onContextMenu={(e) => { if (longPressTriggered) e.preventDefault(); }} className="flex-1 text-left" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
              <div className="flex items-center gap-2"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{song.code}</span><span className="font-medium text-sm">{song.title}</span></div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM</div>
            </button>
            {!selectionMode && (
              <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-lg" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={18} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
            )}
          </div>
        ))}
        {hymnalSongs.length === 0 && <div className="text-center py-12"><Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay canciones</p></div>}
      </div>

      {showEditModal && <EditHymnalModal hymnal={hymnal} onClose={() => setShowEditModal(false)} onSave={(updatedHymnal) => { updateCustomHymnal(updatedHymnal); setShowEditModal(false); }} />}
      {showAddSongModal && <AddSongModal hymnal={hymnal} onClose={() => setShowAddSongModal(false)} />}
    </div>
  );
}

function SearchPage({ onSelectSong }: any) {
  const { state, toggleFavorite, isFavorite } = useApp();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterHymnal, setFilterHymnal] = useState('');
  const allAvailableSongs = useMemo(() => {
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];
    const validPredefinedSongs = allSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const validCustomSongs = state.customSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const customSongsMap = new Map(validCustomSongs.map(s => [s.id, s]));
    const combinedSongs = validPredefinedSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(validPredefinedSongs.map(s => s.id));
    const newCustomSongs = validCustomSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);
  const filteredSongs = useMemo(() => {
    if (!query && !filterHymnal) return [];
    return allAvailableSongs.filter(song => {
      const q = query.toLowerCase();
      const matchesQuery = !query || song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q) || song.code.toLowerCase().includes(q) || song.lyrics.toLowerCase().includes(q);
      const matchesHymnal = !filterHymnal || song.hymnalId === filterHymnal;
      return matchesQuery && matchesHymnal;
    });
  }, [query, filterHymnal, allAvailableSongs]);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-bold mb-1">Buscar</h2><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Busca por título, artista, código o letra</p></div><button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: showFilters ? 'var(--accent)' : 'var(--bg-tertiary)', color: showFilters ? 'white' : 'var(--text-primary)' }}><Filter size={16} /> Filtros</button></div>
      <div className="relative"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} /><input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar canciones..." className="w-full pl-12 pr-12 py-4 rounded-2xl border text-base font-medium" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', boxShadow: 'var(--card-shadow)' }} autoFocus />{query && <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={16} /></button>}</div>
      {showFilters && (<div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div><label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Himnario</label><select value={filterHymnal} onChange={e => setFilterHymnal(e.target.value)} className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><option value="">Todos</option>{[...hymnals, ...state.customHymnals].map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}</select></div></div>)}
      <div><div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>{filteredSongs.length} resultado{filteredSongs.length !== 1 ? 's' : ''}</div><div className="space-y-2">{filteredSongs.map((song) => (<div key={song.id} className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}><button onClick={() => onSelectSong(song)} className="flex-1 text-left"><div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono px-2 py-0.5 rounded-lg font-bold" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>{song.code}</span><span className="font-bold text-base">{song.title}</span></div><div className="text-sm" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM</div></button><button onClick={() => toggleFavorite(song.id)} className="p-2.5 rounded-xl" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={20} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button></div>))}</div>{filteredSongs.length === 0 && query && <div className="text-center py-12"><Music size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-base" style={{ color: 'var(--text-muted)' }}>No se encontraron canciones</p></div>}</div>
    </div>
  );
}

function FavoritesPage({ onSelectSong }: any) {
  const { state, toggleFavorite } = useApp();
  const favoriteSongs = useMemo(() => {
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs].filter(s => state.favorites.includes(s.id));
  }, [state.favorites, state.customSongs]);

  return (
    <div className="space-y-4 pb-4"><div className="flex items-center gap-2"><span className="text-2xl">⭐</span><div><h2 className="text-lg font-bold">Mis Favoritos</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{favoriteSongs.length} canciones</p></div></div>
      {favoriteSongs.length > 0 ? (<div className="space-y-2">{favoriteSongs.map(song => (<div key={song.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><button onClick={() => onSelectSong(song)} className="flex-1 text-left"><div className="flex items-center gap-2"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{song.code}</span><span className="font-medium text-sm">{song.title}</span></div><div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.language}</div></button><button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-lg" style={{ color: 'var(--gold)' }}><Star size={18} fill="currentColor" /></button></div>))}</div>) : (<div className="text-center py-12"><Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aún no tienes favoritos</p></div>)}
    </div>
  );
}

function SetlistsPage({ onSelectSong, showNotification }: any) {
  const { state, addSetlist, removeSetlist, addSongToSetlist, removeSongFromSetlist } = useApp();
  const [selectedSetlist, setSelectedSetlist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');
  const allAvailableSongs = useMemo(() => {
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];
    const validPredefinedSongs = allSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const validCustomSongs = state.customSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const customSongsMap = new Map(validCustomSongs.map(s => [s.id, s]));
    const combinedSongs = validPredefinedSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(validPredefinedSongs.map(s => s.id));
    const newCustomSongs = validCustomSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);
  const currentSetlist = state.setlists.find(s => s.id === selectedSetlist);

  const createSetlist = () => { if (newSetlistName.trim()) { addSetlist(newSetlistName.trim()); setNewSetlistName(''); setShowCreateModal(false); } };

  const exportSetlist = () => {
    if (!currentSetlist) return;
    const data = { setlist: currentSetlist, songs: currentSetlist.songs.map(ss => allAvailableSongs.find(s => s.id === ss.songId)).filter(Boolean) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${currentSetlist.name.replace(/\s+/g, '_')}.json`;
    a.click(); URL.revokeObjectURL(url);
    showNotification('Lista exportada', 'success');
  };

  if (selectedSetlist && currentSetlist) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-3"><button onClick={() => setSelectedSetlist(null)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button><div className="flex-1"><h2 className="text-xl font-bold">{currentSetlist.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentSetlist.songs.length} canciones</p></div><button onClick={exportSetlist} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><Download size={20} /></button></div>
        {currentSetlist.songs.length === 0 ? (<div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay canciones</p></div>) : (
          <div className="space-y-2">{currentSetlist.songs.map((item, index) => {
            const song = allAvailableSongs.find(s => s.id === item.songId);
            return (<div key={item.songId} className="rounded-2xl border p-3 flex items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><span className="text-xs font-bold w-5" style={{ color: 'var(--accent)' }}>{index + 1}.</span><button onClick={() => song && onSelectSong(song)} className="flex-1 text-left"><div className="font-semibold text-sm">{song?.title || 'No encontrada'}</div>{song && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key}</div>}</button><button onClick={() => removeSongFromSetlist(selectedSetlist, item.songId)} className="p-2 rounded-xl text-red-500"><Trash2 size={16} /></button></div>);
          })}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Listas</h1><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Organiza tus canciones</p></div><button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={16} /> Nueva</button></div>
      {state.setlists.length === 0 ? (<div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={48} className="mx-auto mb-3 opacity-40" /><h3 className="font-bold text-base mb-1">No tienes listas</h3><button onClick={() => setShowCreateModal(true)} className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 mt-4" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={14} /> Crear</button></div>) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{state.setlists.map(list => (<div key={list.id} onClick={() => setSelectedSetlist(list.id)} className="rounded-2xl border p-5 cursor-pointer transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}><div className="flex items-start justify-between gap-2 mb-2"><h3 className="font-bold text-base truncate">{list.name}</h3><button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar "${list.name}"?`)) removeSetlist(list.id); }} className="p-1.5 rounded-lg text-red-500"><Trash2 size={16} /></button></div><p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>{list.songs.length} canciones</p><div className="space-y-1">{list.songs.slice(0, 3).map((item, i) => { const song = allAvailableSongs.find(s => s.id === item.songId); return <div key={i} className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>• {song?.title || 'Canción'}</div>; })}</div><div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}><span>Ver lista</span><ArrowRight size={14} /></div></div>))}</div>
      )}
      {showCreateModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreateModal(false)}><div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}><h3 className="font-bold text-lg">Nueva Lista</h3><input type="text" placeholder="Nombre" value={newSetlistName} onChange={e => setNewSetlistName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createSetlist()} autoFocus className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /><div className="flex gap-2"><button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button><button onClick={createSetlist} disabled={!newSetlistName.trim()} className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Crear</button></div></div></div>)}
    </div>
  );
}

function OrdersPage({ onSelectSong, showNotification }: any) {
  const { state, addOrder, removeOrder, updateOrder } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [newOrderName, setNewOrderName] = useState('');
  const [newOrderType, setNewOrderType] = useState('Culto');
  const orders = state.orders || [];
  const allAvailableSongs = useMemo(() => {
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];
    const validPredefinedSongs = allSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const validCustomSongs = (state.customSongs || []).filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    return [...validPredefinedSongs, ...validCustomSongs];
  }, [state.customSongs]);

  const createOrder = () => {
    const newOrder: Order = { id: crypto.randomUUID(), name: newOrderName.trim() || `Orden ${orders.length + 1}`, eventType: newOrderType, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: '' };
    addOrder(newOrder); setNewOrderName(''); setShowCreateModal(false);
  };

  const addTextItem = () => {
    if (!selectedOrder) return;
    const newItem: OrderItem = { id: crypto.randomUUID(), type: 'text', content: '', notes: '' };
    const updatedOrder = { ...selectedOrder, items: [...selectedOrder.items, newItem], updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const addSongItem = () => {
    if (!selectedOrder) return;
    const newItem: OrderItem = { id: crypto.randomUUID(), type: 'song', content: '', notes: '' };
    const updatedOrder = { ...selectedOrder, items: [...selectedOrder.items, newItem], updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const updateItem = (itemId: string, updates: Partial<OrderItem>) => {
    if (!selectedOrder) return;
    const updatedItems = selectedOrder.items.map(item => item.id === itemId ? { ...item, ...updates } : item);
    const updatedOrder = { ...selectedOrder, items: updatedItems, updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const removeItem = (itemId: string) => {
    if (!selectedOrder) return;
    const updatedOrder = { ...selectedOrder, items: selectedOrder.items.filter(item => item.id !== itemId), updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!selectedOrder) return;
    const newItems = [...selectedOrder.items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    const updatedOrder = { ...selectedOrder, items: newItems, updatedAt: new Date().toISOString() };
    updateOrder(updatedOrder); setSelectedOrder(updatedOrder);
  };

  const handleOCRResult = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    const newOrder: Order = {
      id: crypto.randomUUID(),
      name: `Orden extraída ${orders.length + 1}`,
      eventType: 'Culto',
      items: lines.map(line => ({ id: crypto.randomUUID(), type: 'text' as const, content: line.trim(), notes: '' })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '',
    };
    addOrder(newOrder);
    setSelectedOrder(newOrder);
    showNotification('Orden creada desde foto', 'success');
  };

  if (selectedOrder) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
          <div className="flex-1"><h2 className="text-xl font-bold">{selectedOrder.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedOrder.eventType} • {selectedOrder.items.length} elementos</p></div>
        </div>

        <div className="space-y-2">
          {selectedOrder.items.map((item, index) => (
            <div key={item.id} className="rounded-2xl border p-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{index + 1}.</span>
                <select value={item.type} onChange={(e) => updateItem(item.id, { type: e.target.value as 'text' | 'song' })} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <option value="text">Texto</option>
                  <option value="song">Canción</option>
                </select>
                <div className="flex-1" />
                <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1 rounded disabled:opacity-30" style={{ color: 'var(--text-primary)' }}><ChevronLeft size={16} style={{ transform: 'rotate(90deg)' }} /></button>
                <button onClick={() => moveItem(index, 'down')} disabled={index === selectedOrder.items.length - 1} className="p-1 rounded disabled:opacity-30" style={{ color: 'var(--text-primary)' }}><ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} /></button>
                <button onClick={() => removeItem(item.id)} className="p-1 rounded text-red-500"><Trash2 size={16} /></button>
              </div>
              {item.type === 'text' ? (
                <input type="text" value={item.content} onChange={(e) => updateItem(item.id, { content: e.target.value })} placeholder="Texto del orden..." className="w-full p-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              ) : (
                <select value={item.content} onChange={(e) => updateItem(item.id, { content: e.target.value })} className="w-full p-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="">Seleccionar canción...</option>
                  {allAvailableSongs.map(song => <option key={song.id} value={song.id}>{song.code} - {song.title}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={addTextItem} className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}><Plus size={16} /> Texto</button>
          <button onClick={addSongItem} className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Music size={16} /> Canción</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">Órdenes</h2><p className="text-sm" style={{ color: 'var(--text-muted)' }}>{orders.length} órdenes</p></div><div className="flex gap-2"><button onClick={() => setShowOCRModal(true)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }} title="Extraer desde foto"><Camera size={20} /></button><button onClick={() => setShowCreateModal(true)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={20} /></button></div></div>
      <div className="space-y-2">{orders.map(order => (<div key={order.id} className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><button onClick={() => setSelectedOrder(order)} className="flex-1 text-left"><div className="font-medium">{order.name}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.eventType} • {order.items.length} elementos</div></button><button onClick={() => { if (confirm(`¿Eliminar "${order.name}"?`)) removeOrder(order.id); }} className="p-2 rounded-lg" style={{ color: '#ef4444' }}><Trash2 size={16} /></button></div>))}{orders.length === 0 && <div className="text-center py-12"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay órdenes</p></div>}</div>
      {showCreateModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreateModal(false)}><div className="w-full max-w-md rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}><h3 className="font-bold text-lg mb-3">Nuevo Orden</h3><input type="text" value={newOrderName} onChange={e => setNewOrderName(e.target.value)} placeholder="Nombre" className="w-full p-3 rounded-xl border mb-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} /><select value={newOrderType} onChange={e => setNewOrderType(e.target.value)} className="w-full p-3 rounded-xl border mb-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><option>Culto</option><option>Boda</option><option>Bautismo</option><option>Retiro</option><option>Conferencia</option><option>Otro</option></select><button onClick={createOrder} className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Crear</button></div></div>)}
      {showOCRModal && <OCRModal onClose={() => setShowOCRModal(false)} onExtract={handleOCRResult} mode="order" />}
    </div>
  );
}

function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [globalBg, setGlobalBg] = useState<string | null>(null);
  const [showBgManager, setShowBgManager] = useState(false);

  // Cargar fondo global
  useEffect(() => {
    const saved = localStorage.getItem('global-bg-image');
    if (saved) setGlobalBg(saved);
  }, []);

  const handleGlobalBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setGlobalBg(result);
      localStorage.setItem('global-bg-image', result);
    };
    reader.readAsDataURL(file);
  };

  const removeGlobalBg = () => {
    setGlobalBg(null);
    localStorage.removeItem('global-bg-image');
  };

  if (activeTool === 'metronome') return (<div className="pb-4"><button onClick={() => setActiveTool(null)} className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: 'var(--accent)' }}><ChevronLeft size={16} /> Volver</button><Metronome /></div>);
  if (activeTool === 'tuner') return (<div className="pb-4"><button onClick={() => setActiveTool(null)} className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: 'var(--accent)' }}><ChevronLeft size={16} /> Volver</button><Tuner /></div>);
  if (activeTool === 'circle') return (<div className="pb-4"><button onClick={() => setActiveTool(null)} className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: 'var(--accent)' }}><ChevronLeft size={16} /> Volver</button><CircleOfFifths /></div>);

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-2xl font-bold">Herramientas</h2>

      {/* Sección de Fondos Personalizados */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">🖼️ Fondos Personalizados</h3>
          <button onClick={() => setShowBgManager(!showBgManager)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
            {showBgManager ? 'Cerrar' : 'Gestionar'}
          </button>
        </div>

        {showBgManager && (
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h4 className="font-semibold text-sm mb-2">Fondo Global</h4>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Se aplicará a toda la aplicación (excepto himnarios con fondo propio)
              </p>
              {globalBg ? (
                <div className="relative rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
                  <img src={globalBg} alt="Fondo global" className="w-full h-full object-cover" />
                  <button onClick={removeGlobalBg} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed p-4 text-center mb-3" style={{ borderColor: 'var(--border-color)' }}>
                  <Image size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin fondo global</p>
                </div>
              )}
              <label className="cursor-pointer block">
                <input type="file" accept="image/*" onChange={handleGlobalBgChange} className="hidden" />
                <div className="py-3 rounded-xl text-center text-sm font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                  {globalBg ? 'Cambiar Fondo Global' : 'Subir Fondo Global'}
                </div>
              </label>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h4 className="font-semibold text-sm mb-2">💡 Cómo funciona</h4>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>• Cada himnario puede tener su propio fondo (se configura al editar el himnario)</li>
                <li>• El fondo global se usa como respaldo si el himnario no tiene fondo</li>
                <li>• Los fondos se guardan en tu navegador</li>
                <li>• Puedes cambiar o quitar fondos en cualquier momento</li>
              </ul>
            </div>
          </div>
        )}

        {!showBgManager && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {globalBg ? '✅ Fondo global configurado' : 'Configura fondos para diferentes áreas'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveTool('metronome')} className="rounded-2xl border p-5 text-center transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div className="text-4xl mb-2">🎵</div><h3 className="font-bold text-sm">Metrónomo</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>BPM, tap tempo, 3 sonidos</p></button>
        <button onClick={() => setActiveTool('tuner')} className="rounded-2xl border p-5 text-center transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div className="text-4xl mb-2">🎼</div><h3 className="font-bold text-sm">Afinador</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Guitarra, bajo, ukelele</p></button>
        <button onClick={() => setActiveTool('circle')} className="rounded-2xl border p-5 text-center transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div className="text-4xl mb-2">🎯</div><h3 className="font-bold text-sm">Círculo de Quintas</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Visualiza y transpone</p></button>
        <div className="rounded-2xl border p-5 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><div className="text-4xl mb-2">🎸</div><h3 className="font-bold text-sm">Capo</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Calcula posición</p></div>
      </div>
    </div>
  );
}

export default function App() {
  return (<AppProvider><AppContent /></AppProvider>);
}
